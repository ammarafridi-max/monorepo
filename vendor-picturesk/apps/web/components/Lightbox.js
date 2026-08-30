'use client';

import { useEffect } from 'react';

/**
 * Minimal image lightbox (modal). Renders a full-screen overlay with one image,
 * closes on backdrop click, the close button, or Escape. Controlled: pass `src`
 * (null/'' = closed) and an `onClose` handler. Reused by /success and the admin
 * order page.
 */
export default function Lightbox({ src, alt = '', onClose }) {
  useEffect(() => {
    if (!src) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Stop the page behind from scrolling while the modal is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Image preview" onClick={onClose}>
      <button type="button" className="lightbox__close" aria-label="Close preview" onClick={onClose}>
        &times;
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="lightbox__img" src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
