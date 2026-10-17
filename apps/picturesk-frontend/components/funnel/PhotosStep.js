'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { presignUploads, putToStorage, gateUploads } from '../../lib/api';
import { QUALITY, detectImage, reasonFor } from '../../lib/quality';
import { readState, writeState } from '../../lib/generator';
import { track, EVENTS } from '../../lib/analytics';
import { funnelPaths } from '../../lib/products';
import { useFunnel, useNextHref } from './FunnelContext';
import StepNav from './StepNav';

export default function PhotosStep({ product }) {
  const paths = funnelPaths(product);
  const nextHref = useNextHref(paths.review, paths.review);
  const { reusable } = useFunnel();
  const router = useRouter();
  const [mode, setMode] = useState('upload');
  const [items, setItems] = useState([]); 
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const s = readState(product);
    if (s.looks.length === 0 || s.attire.length === 0) {
      router.replace(paths.plan);
      return;
    }
    if (reusable && (s.reuseFromOrderId || s.images.length === 0)) setMode('reuse');
    setItems(s.images.map((url) => ({ id: url, kind: 'existing', url, status: 'ok', reason: null })));
    setReady(true);
  }, [router, product, paths.plan, reusable]);

  useEffect(() => {
    if (!ready) return;
    writeState({ images: items.filter((it) => it.kind === 'existing').map((it) => it.url) }, product);
  }, [items, ready]);

  const updateItem = useCallback((id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const startedRef = useRef(false);
  const addFiles = useCallback((fileList) => {
    const all = Array.from(fileList);
    const isHeic = (f) => /\.hei[cf]$/i.test(f.name) || /^image\/hei[cf]$/i.test(f.type);
    const picked = all.filter((f) => f.type.startsWith('image/') || isHeic(f));
    if (picked.length && !startedRef.current) {
      startedRef.current = true;
      track(EVENTS.UPLOAD_STARTED, { product });
    }
    setError('');
    setItems((prev) => {
      const next = [...prev];
      for (const file of picked) {
        if (next.length >= QUALITY.maxPhotos) break;
        const url = URL.createObjectURL(file);
        next.push({ id: url, kind: 'new', url, file, status: 'checking', reason: null, heic: isHeic(file) });
      }
      return next;
    });
  }, []);

  const checkedRef = useRef(new Set());
  useEffect(() => {
    for (const item of items) {
      if (item.kind !== 'new' || item.status !== 'checking' || checkedRef.current.has(item.id)) continue;
      checkedRef.current.add(item.id);
      verifyItem(item);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  async function verifyItem(item) {
    if (!item.heic) {
      try {
        const reason = reasonFor(await detectImage(item.file));
        if (reason) {
          updateItem(item.id, { status: 'bad', reason });
          return;
        }
      } catch {
      }
    }
    try {
      const file = item.heic && !item.file.type ? new File([item.file], item.file.name, { type: 'image/heic' }) : item.file;
      const { uploads } = await presignUploads([file]);
      await putToStorage(uploads[0].uploadUrl, file);
      let url = uploads[0].publicUrl;
      try {
        const gated = await gateUploads([url]);
        if (Array.isArray(gated?.urls) && gated.urls[0]) url = gated.urls[0];
      } catch (err) {
        if (err.status === 422) {
          const reason =
            err.body?.failures?.[0]?.reason || err.body?.countError || 'Did not pass our check';
          updateItem(item.id, { status: 'bad', reason });
          return;
        }
        throw err;
      }
      setItems((prev) => prev.map((it) => (it.id === item.id ? accept(it, url) : it)));
    } catch (err) {
      const reason =
        err?.status === 429
          ? 'Too many uploads at once. Wait a minute, then remove and re-add this photo.'
          : 'Upload failed, remove and try again';
      updateItem(item.id, { status: 'bad', reason, transient: true });
    }
  }

  const removeAll = useCallback(() => {
    setItems((prev) => {
      for (const it of prev) if (it.kind === 'new') URL.revokeObjectURL(it.url);
      return [];
    });
    checkedRef.current.clear();
  }, []);

  const removeAt = useCallback((id) => {
    setItems((prev) => {
      const gone = prev.find((it) => it.id === id);
      if (gone?.kind === 'new') URL.revokeObjectURL(gone.url);
      return prev.filter((it) => it.id !== id);
    });
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const checking = items.some((it) => it.kind === 'new' && it.status === 'checking');
  const badCount = items.filter((it) => it.kind === 'new' && it.status === 'bad').length;
  const countOk = items.length >= QUALITY.minPhotos && items.length <= QUALITY.maxPhotos;
  const photosReady = countOk && badCount === 0 && !checking && items.length > 0;
  const reusing = mode === 'reuse' && Boolean(reusable);
  const canContinue = reusing || photosReady;

  const completedRef = useRef(false);
  useEffect(() => {
    if (photosReady && !completedRef.current) {
      completedRef.current = true;
      track(EVENTS.UPLOAD_COMPLETED, { product });
    }
  }, [photosReady]);
  const gateFailRef = useRef(false);
  useEffect(() => {
    if (badCount > 0 && !gateFailRef.current) {
      gateFailRef.current = true;
      track(EVENTS.QUALITY_GATE_FAILED, { product });
    } else if (badCount === 0) {
      gateFailRef.current = false;
    }
  }, [badCount]);

  const accept = (it, url) => {
    URL.revokeObjectURL(it.url);
    return { ...it, kind: 'existing', url, file: undefined, status: 'ok', reason: null, heic: false };
  };

  function onContinue() {
    if (!canContinue) return;
    setError('');
    if (reusing) {
      writeState({ reuseFromOrderId: reusable.orderId }, product);
    } else {
      writeState({ images: items.map((it) => it.url), reuseFromOrderId: '' }, product);
    }
    router.push(nextHref);
  }

  if (!ready) return null;

  let note;
  if (items.length < QUALITY.minPhotos) {
    note = `Add at least ${QUALITY.minPhotos} photos to continue.`;
  } else if (items.length > QUALITY.maxPhotos) {
    note = `Use at most ${QUALITY.maxPhotos} photos.`;
  } else if (checking) {
    note = 'Checking your photos.';
  } else if (badCount > 0) {
    const transient = items.filter((it) => it.kind === 'new' && it.status === 'bad' && it.transient).length;
    note =
      transient === badCount
        ? `${badCount} photo${badCount === 1 ? '' : 's'} did not upload. Remove and try again.`
        : `${badCount} photo${badCount === 1 ? '' : 's'} need a clearer single face. Remove or replace them.`;
  } else {
    note = `${items.length} photos ready.`;
  }

  return (
    <section>
      <h1 className="h2">{reusable ? 'Your photos.' : 'Upload your photos.'}</h1>
      <p className="section__lede">
        Your photos are the single biggest factor in how much the results look like you.
        {reusable ? ' We still have the photos from your last order, so you can skip the upload.' : ` Add ${QUALITY.minPhotos} to ${QUALITY.maxPhotos} recent photos of just you.`}
      </p>

      {reusable && (
        <div className="reuse" role="radiogroup" aria-label="Photos">
          <button
            type="button"
            className={`reuse__opt${reusing ? ' reuse__opt--on' : ''}`}
            role="radio"
            aria-checked={reusing}
            onClick={() => setMode('reuse')}
          >
            <span className="reuse__title">Use the photos from your last order</span>
            <span className="reuse__meta">
              {reusable.count} photos from {reusable.date}. Ready in minutes, no upload.
            </span>
          </button>
          <button
            type="button"
            className={`reuse__opt${!reusing ? ' reuse__opt--on' : ''}`}
            role="radio"
            aria-checked={!reusing}
            onClick={() => setMode('upload')}
          >
            <span className="reuse__title">Upload new photos</span>
            <span className="reuse__meta">A new haircut, a new beard, or just better selfies. We start fresh.</span>
          </button>
        </div>
      )}

      {reusing && (
        <div className="reuse__photos" data-clarity-mask="true">
          {reusable.images.length > 0 ? (
            <>
              <p className="gen-hint">The photos we will use, exactly as you uploaded them last time.</p>
              <div className="thumbs">
                {reusable.images.map((url, i) => (
                  <div className="thumb thumb--ok" key={url}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`photo ${i + 1}`} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="gen-hint">
              Your {reusable.count} original photos are on file. They will appear on this order once it starts.
            </p>
          )}
        </div>
      )}

      <div hidden={reusing}>
      <ul className="reqs">
        <li className="reqs__good">
          Do: different angles and expressions, even lighting, your face clear and up close.
        </li>
        <li className="reqs__bad">
          Avoid: sunglasses, hats, filters, blurry shots, and photos with other people. We check each
          one and will flag any to swap.
        </li>
      </ul>

      <div className="capture-cta">
        <p className="capture-cta__text">
          Want the best results? <span>Let us guide you through a quick photo shoot.</span>
        </p>
        <Link className="btn capture-cta__btn" href={paths.capture}>
          Use my camera
        </Link>
      </div>

      <div className="card card--bare">
        <div
          className={`dropzone${dragging ? ' dropzone--active' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
        >
          <p className="dropzone__title">
            <span className="dropzone__desktop">Drag your photos here, or click to choose.</span>
            <span className="dropzone__touch">Tap to choose your photos.</span>
          </p>
          <p className="dropzone__hint">
            One face per photo, different angles, good light, no sunglasses.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {items.length > 0 && (
          <div className="thumbs" data-clarity-mask="true">
            {items.map((it, i) => (
              <div
                className={`thumb${it.status === 'bad' ? ' thumb--bad' : ''}${
                  it.status === 'checking' ? ' thumb--checking' : ''
                }${it.status === 'ok' ? ' thumb--ok' : ''}`}
                key={it.id}
              >
                {it.heic ? (
                  <span className="thumb__ph">HEIC</span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.url} alt={`photo ${i + 1}`} />
                )}
                {it.status === 'checking' && (
                  <span className="thumb__spinner" role="status" aria-label="Checking this photo" />
                )}
                {it.status === 'ok' && (
                  <span className="thumb__check" role="img" aria-label="Accepted">
                    <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                      <path
                        d="M20 6 9 17l-5-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
                <button
                  type="button"
                  className="thumb__remove"
                  aria-label="Delete photo"
                  onClick={() => removeAt(it.id)}
                >
                  &times;
                </button>
                {it.status === 'bad' && it.reason && <p className="thumb__reason">{it.reason}</p>}
              </div>
            ))}
          </div>
        )}

        <p className="formnote">
          {note}
          {items.length > 0 && (
            <>
              {' '}
              <button type="button" className="linkbtn" onClick={removeAll}>
                Remove all photos
              </button>
            </>
          )}
        </p>
        {error && <p className="error">{error}</p>}
      </div>

      </div>

      <StepNav
        backHref={paths.plan}
        canContinue={canContinue}
        missing={!reusing && !canContinue ? note : ''}
        label={!reusing && checking ? 'Checking your photos' : 'Continue'}
        onContinue={onContinue}
      />
    </section>
  );
}
