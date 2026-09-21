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

// Step 4: photos. One unified grid holds both photos already uploaded on a
// previous visit (kind 'existing', an R2 URL) and newly picked files (kind 'new',
// checked by the client gate before upload). EVERY photo has a delete button, and
// the dropzone stays available so more can be added. On Continue, the new files go
// direct-to-R2 and the full set (existing + new) is carried to the pay step.
export default function PhotosStep({ product }) {
  const paths = funnelPaths(product);
  const nextHref = useNextHref(paths.review, paths.review);
  const { reusable } = useFunnel();
  const router = useRouter();
  // 'reuse' = generate from the model of an earlier order; 'upload' = fresh photos.
  const [mode, setMode] = useState('upload');
  const [items, setItems] = useState([]); // { id, kind:'existing'|'new', url, file?, status, reason }
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const s = readState(product);
    // Guard the funnel order: no selections means the plan step was skipped.
    if (s.looks.length === 0 || s.attire.length === 0) {
      router.replace(paths.plan);
      return;
    }
    // Reuse is the default for anyone who has a model; a stored choice wins.
    if (reusable && (s.reuseFromOrderId || s.images.length === 0)) setMode('reuse');
    // Seed with any already-uploaded photos so the user can keep, delete, or add to them.
    setItems(s.images.map((url) => ({ id: url, kind: 'existing', url, status: 'ok', reason: null })));
    setReady(true);
  }, [router, product, paths.plan, reusable]);

  // Keep localStorage's uploaded set in sync with the EXISTING items, so deleting
  // an already-uploaded photo sticks across a refresh. New (not-yet-uploaded) items
  // are added on Continue.
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
    // Browsers cannot show HEIC and the gate cannot read it. The picker asks for
    // JPEG/PNG/WebP (which makes iPhones convert on the way out); one that arrives
    // anyway, by drag and drop, is shown with a reason rather than dropped silently.
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
        if (isHeic(file)) {
          next.push({
            id: url,
            kind: 'new',
            url,
            file,
            status: 'bad',
            reason: 'HEIC is not supported. Export it as JPEG and add it again.',
            heic: true,
          });
          continue;
        }
        next.push({ id: url, kind: 'new', url, file, status: 'checking', reason: null });
      }
      return next;
    });
  }, []);

  // Verify each NEW item as it is added. A fast client pre-check catches obvious
  // problems instantly; then the photo is uploaded and run through the REAL server
  // gate. The green tick appears ONLY after the server confirms it passes (the item
  // is promoted to a verified 'existing'); until then it stays 'checking' (no tick).
  // Existing items already passed once and are skipped.
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
    // 1) Fast client pre-check (Chromium-only; defers to the server otherwise).
    try {
      const reason = reasonFor(await detectImage(item.file));
      if (reason) {
        updateItem(item.id, { status: 'bad', reason });
        return;
      }
    } catch {
      /* browser detector unavailable/flaky -> defer to the server gate below */
    }
    // 2) Upload, then the REAL server gate. Only a server pass earns the tick.
    try {
      const { uploads } = await presignUploads([item.file]);
      await putToStorage(uploads[0].uploadUrl, item.file);
      const url = uploads[0].publicUrl;
      try {
        await gateUploads([url]);
      } catch (err) {
        if (err.status === 422) {
          const reason =
            err.body?.failures?.[0]?.reason || err.body?.countError || 'Did not pass our check';
          updateItem(item.id, { status: 'bad', reason });
          return;
        }
        throw err;
      }
      // Passed the real gate -> promote to a verified 'existing' item (green tick).
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

  // Any NEW photo still being uploaded + server-gated (no tick yet).
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

  // Promote a passed 'new' item to an accepted 'existing' one: it now carries its R2
  // URL, shows the green tick, and is never re-uploaded or re-screened again.
  const accept = (it, url) => {
    URL.revokeObjectURL(it.url);
    return { ...it, kind: 'existing', url, file: undefined, status: 'ok', reason: null };
  };

  function onContinue() {
    if (!canContinue) return;
    setError('');
    if (reusing) {
      writeState({ reuseFromOrderId: reusable.orderId }, product);
    } else {
      // Every photo was uploaded and passed the server gate as it was added, so all
      // items here are verified 'existing' ones. Just carry the set to the review step.
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
          // data-clarity-mask: these are the customer's uploaded face photos; never
          // record them in Clarity session replay (masked regardless of project mode).
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
