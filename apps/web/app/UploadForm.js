'use client';

import { useCallback, useRef, useState } from 'react';
import { presignUploads, putToStorage, createCheckout } from '../lib/api';
import { QUALITY, detectImage, reasonFor } from '../lib/quality';

// The upload + checkout form. Anonymous by default; `authed`/`initialEmail` come
// from the server so a logged-in user's order can be linked to them after
// checkout. Auth never gates this flow.
export default function UploadForm({ authed = false, initialEmail = '' }) {
  const [items, setItems] = useState([]); // { id, file, url, status: 'checking'|'ok'|'bad', reason }
  const [email, setEmail] = useState(initialEmail);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | uploading | redirecting
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const updateItem = useCallback((id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const addFiles = useCallback(
    (fileList) => {
      const picked = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
      const added = [];
      setItems((prev) => {
        const next = [...prev];
        for (const file of picked) {
          if (next.length >= QUALITY.maxPhotos) break;
          const url = URL.createObjectURL(file);
          const item = { id: url, file, url, status: 'checking', reason: null };
          next.push(item);
          added.push(item);
        }
        return next;
      });
      setError('');
      for (const item of added) {
        detectImage(item.file)
          .then((d) => {
            const reason = reasonFor(d);
            updateItem(item.id, { status: reason ? 'bad' : 'ok', reason });
          })
          .catch(() => updateItem(item.id, { status: 'ok', reason: null }));
      }
    },
    [updateItem]
  );

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

  const busy = phase !== 'idle';
  const checking = items.some((it) => it.status === 'checking');
  const badCount = items.filter((it) => it.status === 'bad').length;
  const countOk = items.length >= QUALITY.minPhotos && items.length <= QUALITY.maxPhotos;
  const emailOk = /.+@.+\..+/.test(email);
  const canSubmit = countOk && badCount === 0 && !checking && emailOk && !busy;

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    try {
      setPhase('uploading');
      const files = items.map((it) => it.file);
      const { uploads } = await presignUploads(files);
      await Promise.all(uploads.map((u, i) => putToStorage(u.uploadUrl, files[i])));

      setPhase('redirecting');
      const { orderId, checkoutUrl } = await createCheckout(
        email,
        uploads.map((u) => u.publicUrl)
      );

      // If logged in, associate this order with the account before leaving for
      // Stripe. No-op for anonymous visitors, so the anonymous flow is unchanged.
      if (authed) {
        await fetch('/api/orders/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        }).catch(() => {});
      }

      window.location.href = checkoutUrl;
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
          setError('Some photos did not pass our check. See the notes on them below.');
        } else {
          setError(body.countError || 'Your photos did not pass our check. Please adjust and try again.');
        }
        setPhase('idle');
        return;
      }
      setError(err.message || 'Something went wrong. Please try again.');
      setPhase('idle');
    }
  }

  const ctaLabel =
    phase === 'uploading'
      ? 'Uploading your photos'
      : phase === 'redirecting'
        ? 'Taking you to checkout'
        : 'Get my headshots';

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
    note = `${items.length} photos look good. You pay after this, on Stripe.`;
  }

  return (
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
          Add {QUALITY.minPhotos} to {QUALITY.maxPhotos} clear photos of one person. One face per
          photo, different angles, good light, no sunglasses.
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

      <div className="field">
        <label className="label" htmlFor="email">
          Where should we send them?
        </label>
        <input
          id="email"
          className="input"
          type="email"
          inputMode="email"
          placeholder="you@work.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
        />
      </div>

      <button className="cta" type="submit" disabled={!canSubmit}>
        {ctaLabel} <span className="cta__price">&middot; $35</span>
      </button>

      <p className="formnote">{note}</p>

      {error && <p className="error">{error}</p>}
    </form>
  );
}
