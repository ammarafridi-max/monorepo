'use client';

import { useCallback, useRef, useState } from 'react';
import { presignUploads, putToStorage, createCheckout } from '../lib/api';

const MIN_PHOTOS = 5;
const MAX_PHOTOS = 20;

export default function UploadPage() {
  const [items, setItems] = useState([]); // { file, url }
  const [email, setEmail] = useState('');
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | uploading | redirecting
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const addFiles = useCallback((fileList) => {
    const picked = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    setItems((prev) => {
      const next = [...prev];
      for (const file of picked) {
        if (next.length >= MAX_PHOTOS) break;
        next.push({ file, url: URL.createObjectURL(file) });
      }
      return next;
    });
    setError('');
  }, []);

  const removeAt = useCallback((i) => {
    setItems((prev) => {
      const copy = [...prev];
      const [gone] = copy.splice(i, 1);
      if (gone) URL.revokeObjectURL(gone.url);
      return copy;
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
  const canSubmit = items.length >= MIN_PHOTOS && /.+@.+\..+/.test(email) && !busy;

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
      const { checkoutUrl } = await createCheckout(
        email,
        uploads.map((u) => u.publicUrl)
      );
      window.location.href = checkoutUrl;
    } catch (err) {
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

  return (
    <main className="wrap">
      <h1 className="display">Headshots that don&apos;t look AI.</h1>
      <p className="lede">
        Upload a few selfies. We train a model on your face and give you studio-quality
        headshots, ready for LinkedIn in about an hour.
      </p>
      <p className="lede muted">One price, thirty-five dollars. No subscription.</p>

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
            Add {MIN_PHOTOS} to 15 clear photos of one person. Different angles, good light, no
            sunglasses.
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
              <div className="thumb" key={it.url}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.url} alt={`selfie ${i + 1}`} />
                {!busy && (
                  <button
                    type="button"
                    className="thumb__remove"
                    aria-label="Remove photo"
                    onClick={() => removeAt(i)}
                  >
                    &times;
                  </button>
                )}
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

        <p className="formnote">
          {items.length < MIN_PHOTOS
            ? `Add at least ${MIN_PHOTOS} photos to continue.`
            : `${items.length} photo${items.length === 1 ? '' : 's'} ready. You pay after this, on Stripe.`}
        </p>

        {error && <p className="error">{error}</p>}
      </form>
    </main>
  );
}
