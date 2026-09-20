'use client';

import { useEffect, useRef } from 'react';
import { hub } from '../data/hub';

// The chooser behind the generic "Get started" CTA: a small modal with one card per
// service, each straight into its funnel. Closes on backdrop click, the close
// button or Escape; focus lands on the first card when it opens and returns to the
// trigger on close (the caller re-focuses). Reads the same service list as the hub.
export default function ServicePicker({ open, onClose }) {
  const firstRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="picker" role="dialog" aria-modal="true" aria-labelledby="picker-title" onClick={onClose}>
      <div className="picker__card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="picker__close" aria-label="Close" onClick={onClose}>
          &times;
        </button>
        <p className="eyebrow">Get started</p>
        <h2 id="picker-title" className="picker__title">
          What are the photos for?
        </h2>
        <p className="picker__lede">Same selfies either way. Pick the shoot and we take you straight to it.</p>
        <div className="picker__options">
          {hub.services.items.map((s, i) => (
            <a className="picker__option" href={s.href} key={s.id} ref={i === 0 ? firstRef : undefined}>
              <span className="picker__name">{s.title}</span>
              <span className="picker__who">{s.who}</span>
              <span className="picker__go">
                Start <span className="picker__price">from ${s.from}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
