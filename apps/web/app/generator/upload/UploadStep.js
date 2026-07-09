'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { presignUploads, putToStorage, submitOrderImages, getOrder } from '../../../lib/api';
import { QUALITY, detectImage, reasonFor } from '../../../lib/quality';
import { clearState } from '../../../lib/generator';
import { track, EVENTS } from '../../../lib/analytics';

// Payment already went through if the order has advanced this far.
const ALREADY_STARTED = new Set(['TRAINING', 'GENERATING', 'DELIVERED', 'FAILED']);

// The POST-PAYMENT upload step. Loads the paid order (must be AWAITING_UPLOAD),
// runs the same client quality gate as before for fast feedback, then submits the
// photos to POST /orders/:id/images which is the real gate + the training trigger.
export default function UploadStep() {
  const router = useRouter();
  const orderId = useSearchParams().get('order');

  // loading | paymentPending | ready | error  (+ uploading | submitting while busy)
  const [phase, setPhase] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  // Load the order. Only AWAITING_UPLOAD may upload; if the Stripe webhook has not
  // flipped it there yet (just paid), poll briefly. If it already advanced, the
  // photos were submitted, so send them to the live status page.
  useEffect(() => {
    if (!orderId) {
      setPhase('error');
      setLoadError('No order in the link.');
      return;
    }
    let alive = true;
    let tries = 0;
    let timer;
    async function check() {
      try {
        const order = await getOrder(orderId);
        if (!alive) return;
        if (order.status === 'AWAITING_UPLOAD') {
          setPhase('ready');
          return;
        }
        if (ALREADY_STARTED.has(order.status)) {
          router.replace(`/success?orderId=${orderId}`);
          return;
        }
        // AWAITING_PAYMENT: the webhook may lag a second or two after Stripe.
        if (tries++ < 10) {
          setPhase('paymentPending');
          timer = setTimeout(check, 2000);
          return;
        }
        setPhase('error');
        setLoadError('We have not recorded your payment yet. If you just paid, wait a moment and refresh.');
      } catch (err) {
        if (!alive) return;
        setPhase('error');
        setLoadError(err.message || 'Could not load your order.');
      }
    }
    check();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [orderId, router]);

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

  // Client quality check off committed state (same pattern as the old form).
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

  const busy = phase === 'uploading' || phase === 'submitting';
  const checking = items.some((it) => it.status === 'checking');
  const badCount = items.filter((it) => it.status === 'bad').length;
  const countOk = items.length >= QUALITY.minPhotos && items.length <= QUALITY.maxPhotos;
  const photosReady = countOk && badCount === 0 && !checking;
  const canSubmit = photosReady && !busy;

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

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    try {
      setPhase('uploading');
      const files = items.map((it) => it.file);
      const { uploads } = await presignUploads(files);
      await Promise.all(uploads.map((u, i) => putToStorage(u.uploadUrl, files[i])));

      setPhase('submitting');
      await submitOrderImages(orderId, uploads.map((u) => u.publicUrl));

      // Order is now TRAINING. Clear the funnel state and watch it on the status page.
      clearState();
      window.location.href = `/success?orderId=${orderId}`;
    } catch (err) {
      if (err.status === 422) {
        const body = err.body || {};
        if (Array.isArray(body.failures) && body.failures.length) {
          setItems((prev) =>
            prev.map((it, i) => {
              const f = body.failures.find((x) => x.index === i);
              return f ? { ...it, status: 'bad', reason: f.reason } : it;
            })
          );
          setError('Some photos did not pass our check. See the notes below.');
        } else {
          setError(body.countError || 'Your photos did not pass our check. Please adjust and try again.');
        }
        setPhase('ready');
        return;
      }
      if (err.status === 409) {
        // Already submitted (a double click / stale tab). Go watch the status.
        window.location.href = `/success?orderId=${orderId}`;
        return;
      }
      setError(err.message || 'Something went wrong. Please try again.');
      setPhase('ready');
    }
  }

  if (phase === 'loading') {
    return (
      <section>
        <p className="muted">Loading your order.</p>
      </section>
    );
  }
  if (phase === 'paymentPending') {
    return (
      <section>
        <p className="eyebrow">Step 5</p>
        <h1 className="h2">Confirming your payment.</h1>
        <p className="section__lede">This takes a few seconds. Hold tight.</p>
      </section>
    );
  }
  if (phase === 'error') {
    return (
      <section>
        <h1 className="h2">We could not open your upload.</h1>
        <p className="muted">{loadError}</p>
        <p style={{ marginTop: 12 }}>
          <a href="/generator/looks">Start over</a>
        </p>
      </section>
    );
  }

  const ctaLabel =
    phase === 'uploading'
      ? 'Uploading your photos'
      : phase === 'submitting'
        ? 'Starting your headshots'
        : 'Start my headshots';

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
    note = `${items.length} photos look good. We start as soon as you submit.`;
  }

  return (
    <section>
      <p className="eyebrow">Step 5</p>
      <h1 className="h2">Upload your photos.</h1>
      <p className="section__lede">
        You are paid. Add {QUALITY.minPhotos} to {QUALITY.maxPhotos} clear photos of one person and we
        start right away.
      </p>

      <form className="card" onSubmit={onSubmit}>
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
            {QUALITY.minPhotos} to {QUALITY.maxPhotos} clear photos of one person. One face per photo,
            different angles, good light, no sunglasses.
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

        <button className="cta" type="submit" disabled={!canSubmit}>
          {ctaLabel}
        </button>

        <p className="formnote">{note}</p>
        {error && <p className="error">{error}</p>}
      </form>
    </section>
  );
}
