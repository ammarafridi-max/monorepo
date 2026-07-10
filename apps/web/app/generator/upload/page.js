'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { presignUploads, putToStorage } from '../../../lib/api';
import { QUALITY, detectImage, reasonFor } from '../../../lib/quality';
import { readState, writeState } from '../../../lib/generator';
import { track, EVENTS } from '../../../lib/analytics';

// Step 2: upload photos. The client quality gate runs here for fast feedback;
// on Continue the photos go direct-to-R2 (presign + PUT) and their URLs are stored
// so the pay step can pass them to /checkout. Payment is the next (last) step.
export default function UploadPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | uploading
  const [already, setAlready] = useState([]); // URLs from a previous upload (came back from pay)
  const [ready, setReady] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const s = readState();
    // Guard the funnel order: no selections means step 1 was skipped.
    if (s.looks.length === 0 || s.attire.length === 0) {
      router.replace('/generator/select');
      return;
    }
    if (s.images.length > 0) setAlready(s.images);
    setReady(true);
  }, [router]);

  const updateItem = useCallback((id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const addFiles = useCallback((fileList) => {
    const picked = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    setError('');
    setItems((prev) => {
      const next = [...prev];
      for (const file of picked) {
        if (next.length >= QUALITY.maxPhotos) break;
        const url = URL.createObjectURL(file);
        next.push({ id: url, file, url, status: 'checking', reason: null });
      }
      return next;
    });
  }, []);

  // Client quality check off committed state.
  const checkedRef = useRef(new Set());
  useEffect(() => {
    for (const item of items) {
      if (item.status !== 'checking' || checkedRef.current.has(item.id)) continue;
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
      if (gone) URL.revokeObjectURL(gone.url);
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

  const busy = phase === 'uploading';
  const checking = items.some((it) => it.status === 'checking');
  const badCount = items.filter((it) => it.status === 'bad').length;
  const countOk = items.length >= QUALITY.minPhotos && items.length <= QUALITY.maxPhotos;
  const photosReady = countOk && badCount === 0 && !checking;
  const canContinue = photosReady && !busy;

  // Funnel analytics (no PII).
  const startedRef = useRef(false);
  useEffect(() => {
    if (items.length > 0 && !startedRef.current) {
      startedRef.current = true;
      track(EVENTS.UPLOAD_STARTED);
    }
  }, [items.length]);
  const completedRef = useRef(false);
  useEffect(() => {
    if (photosReady && items.length > 0 && !completedRef.current) {
      completedRef.current = true;
      track(EVENTS.UPLOAD_COMPLETED);
    }
  }, [photosReady, items.length]);
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
      const files = items.map((it) => it.file);
      const { uploads } = await presignUploads(files);
      await Promise.all(uploads.map((u, i) => putToStorage(u.uploadUrl, files[i])));
      // Hand the public R2 URLs to the pay step.
      writeState({ images: uploads.map((u) => u.publicUrl) });
      router.push('/generator/pay');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setPhase('idle');
    }
  }

  function chooseDifferent() {
    setAlready([]);
    writeState({ images: [] });
  }

  if (!ready) return null;

  // Came back from the pay step: photos already uploaded. Offer to continue or redo.
  if (already.length > 0) {
    return (
      <section>
        <p className="eyebrow">Step 2</p>
        <h1 className="h2">Your photos are ready.</h1>
        <p className="section__lede">
          {already.length} photos uploaded. Continue to payment, or choose different photos.
        </p>
        <div className="thumbs">
          {already.map((url, i) => (
            <div className="thumb" key={url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`photo ${i + 1}`} />
            </div>
          ))}
        </div>
        <div className="gennav">
          <button className="btn btn--link" type="button" onClick={chooseDifferent}>
            Choose different photos
          </button>
          <button className="btn btn--primary" type="button" onClick={() => router.push('/generator/pay')}>
            Continue
          </button>
        </div>
      </section>
    );
  }

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
    note = `${items.length} photos look good.`;
  }

  return (
    <section>
      <p className="eyebrow">Step 2</p>
      <h1 className="h2">Upload your photos.</h1>
      <p className="section__lede">
        Add {QUALITY.minPhotos} to {QUALITY.maxPhotos} clear photos of one person. You pay on the next
        step, after we check them.
      </p>

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
                <img src={it.url} alt={`selfie ${i + 1}`} />
                {!busy && (
                  <button
                    type="button"
                    className="thumb__remove"
                    aria-label="Remove photo"
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
        <a className="btn btn--link" href="/generator/select">
          Back
        </a>
        <button className="btn btn--primary" type="button" disabled={!canContinue} onClick={onContinue}>
          {busy ? 'Uploading your photos' : 'Continue'}
        </button>
      </div>
    </section>
  );
}
