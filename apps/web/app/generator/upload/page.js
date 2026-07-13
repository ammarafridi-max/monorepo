'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { presignUploads, putToStorage, gateUploads } from '../../../lib/api';
import { QUALITY, detectImage, reasonFor } from '../../../lib/quality';
import { readState, writeState } from '../../../lib/generator';
import { track, EVENTS } from '../../../lib/analytics';

// Step 2: upload photos. One unified grid holds both photos already uploaded on a
// previous visit (kind 'existing', an R2 URL) and newly picked files (kind 'new',
// checked by the client gate before upload). EVERY photo has a delete button, and
// the dropzone stays available so more can be added. On Continue, the new files go
// direct-to-R2 and the full set (existing + new) is carried to the pay step.
export default function UploadPage() {
  const router = useRouter();
  const [items, setItems] = useState([]); // { id, kind:'existing'|'new', url, file?, status, reason }
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | uploading
  const [ready, setReady] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const s = readState();
    // Guard the funnel order: no selections means step 1 was skipped.
    if (s.looks.length === 0 || s.attire.length === 0) {
      router.replace('/generator/select');
      return;
    }
    // Seed with any already-uploaded photos so the user can keep, delete, or add to them.
    setItems(s.images.map((url) => ({ id: url, kind: 'existing', url, status: 'ok', reason: null })));
    setReady(true);
  }, [router]);

  // Keep localStorage's uploaded set in sync with the EXISTING items, so deleting
  // an already-uploaded photo sticks across a refresh. New (not-yet-uploaded) items
  // are added on Continue.
  useEffect(() => {
    if (!ready) return;
    writeState({ images: items.filter((it) => it.kind === 'existing').map((it) => it.url) });
  }, [items, ready]);

  const updateItem = useCallback((id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const startedRef = useRef(false);
  const addFiles = useCallback((fileList) => {
    const picked = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (picked.length && !startedRef.current) {
      startedRef.current = true;
      track(EVENTS.UPLOAD_STARTED);
    }
    setError('');
    setItems((prev) => {
      const next = [...prev];
      for (const file of picked) {
        if (next.length >= QUALITY.maxPhotos) break;
        const url = URL.createObjectURL(file);
        next.push({ id: url, kind: 'new', url, file, status: 'checking', reason: null });
      }
      return next;
    });
  }, []);

  // Client quality check for NEW items only (existing ones already passed once).
  const checkedRef = useRef(new Set());
  useEffect(() => {
    for (const item of items) {
      if (item.kind !== 'new' || item.status !== 'checking' || checkedRef.current.has(item.id)) continue;
      checkedRef.current.add(item.id);
      detectImage(item.file)
        .then((d) => {
          const reason = reasonFor(d);
          updateItem(item.id, { status: reason ? 'bad' : 'ok', reason });
        })
        .catch(() => updateItem(item.id, { status: 'ok', reason: null }));
    }
  }, [items, updateItem]);

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

  const busy = phase === 'uploading' || phase === 'checking';
  const checking = items.some((it) => it.kind === 'new' && it.status === 'checking');
  const badCount = items.filter((it) => it.kind === 'new' && it.status === 'bad').length;
  const countOk = items.length >= QUALITY.minPhotos && items.length <= QUALITY.maxPhotos;
  const photosReady = countOk && badCount === 0 && !checking && items.length > 0;
  const canContinue = photosReady && !busy;

  const completedRef = useRef(false);
  useEffect(() => {
    if (photosReady && !completedRef.current) {
      completedRef.current = true;
      track(EVENTS.UPLOAD_COMPLETED);
    }
  }, [photosReady]);
  const gateFailRef = useRef(false);
  useEffect(() => {
    if (badCount > 0 && !gateFailRef.current) {
      gateFailRef.current = true;
      track(EVENTS.QUALITY_GATE_FAILED);
    } else if (badCount === 0) {
      gateFailRef.current = false;
    }
  }, [badCount]);

  async function onContinue() {
    if (!canContinue) return;
    setError('');
    try {
      setPhase('uploading');
      const newItems = items.filter((it) => it.kind === 'new');
      let urlByNewId = new Map();
      if (newItems.length) {
        const files = newItems.map((it) => it.file);
        const { uploads } = await presignUploads(files);
        await Promise.all(uploads.map((u, i) => putToStorage(u.uploadUrl, files[i])));
        urlByNewId = new Map(newItems.map((it, i) => [it.id, uploads[i].publicUrl]));
      }
      // Preserve on-screen order across existing + newly uploaded photos.
      const images = items.map((it) => (it.kind === 'existing' ? it.url : urlByNewId.get(it.id)));
      writeState({ images });

      // Run the SERVER gate here (not on the pay button), so the slow evaluation
      // happens with a "Checking your photos" state and /checkout is then instant.
      setPhase('checking');
      await gateUploads(images);
      router.push('/generator/pay');
    } catch (err) {
      if (err.status === 422) {
        // Flag the exact photos the server rejected, by their position in `images`.
        const failures = err.body?.failures || [];
        const byIndex = new Map(failures.map((f) => [f.index, f.reason]));
        setItems((prev) =>
          prev.map((it, i) =>
            byIndex.has(i) ? { ...it, status: 'bad', reason: byIndex.get(i) } : it
          )
        );
        setError(
          err.body?.countError ||
            'Some photos did not pass our check. Replace the flagged ones and try again.'
        );
        setPhase('idle');
        return;
      }
      setError(err.message || 'Something went wrong. Please try again.');
      setPhase('idle');
    }
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
    note = `${badCount} photo${badCount === 1 ? '' : 's'} need a clearer single face. Remove or replace them.`;
  } else {
    note = `${items.length} photos ready. You pay on the next step.`;
  }

  return (
    <section>
      <p className="eyebrow">Step 2</p>
      <h1 className="h2">Upload your photos.</h1>
      <p className="section__lede">
        Your photos are the single biggest factor in how much the results look like you. Add{' '}
        {QUALITY.minPhotos} to {QUALITY.maxPhotos} recent photos of just you.
      </p>
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
        <Link className="btn btn--primary" href="/generator/capture">
          Use my camera
        </Link>
      </div>

      <div className="card">
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
          <p className="dropzone__title">Drag your photos here, or click to choose.</p>
          <p className="dropzone__hint">
            One face per photo, different angles, good light, no sunglasses.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {items.length > 0 && (
          <div className="thumbs">
            {items.map((it, i) => (
              <div
                className={`thumb${it.status === 'bad' ? ' thumb--bad' : ''}${
                  it.status === 'checking' ? ' thumb--checking' : ''
                }`}
                key={it.id}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.url} alt={`photo ${i + 1}`} />
                {!busy && (
                  <button
                    type="button"
                    className="thumb__remove"
                    aria-label="Delete photo"
                    onClick={() => removeAt(it.id)}
                  >
                    &times;
                  </button>
                )}
                {it.status === 'bad' && it.reason && <p className="thumb__reason">{it.reason}</p>}
              </div>
            ))}
          </div>
        )}

        <p className="formnote">{note}</p>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="gennav">
        <Link className="btn btn--link" href="/generator/select">
          Back
        </Link>
        <button className="btn btn--primary" type="button" disabled={!canContinue} onClick={onContinue}>
          {phase === 'checking'
            ? 'Checking your photos'
            : phase === 'uploading'
              ? 'Uploading your photos'
              : 'Continue'}
        </button>
      </div>
    </section>
  );
}
