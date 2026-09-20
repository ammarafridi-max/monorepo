'use client';

import { useEffect, useRef, useState } from 'react';
import { services } from '../data/services';

function ChevronDown({ open }) {
  return (
    <svg
      className={`services__chev${open ? ' services__chev--open' : ''}`}
      width="14"
      height="14"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The Services entry in the nav. On desktop a hover-or-click dropdown, one column
// per product; in the mobile drawer the same groups rendered as plain lists, since
// a dropdown inside a drawer is two menus deep. Opens on hover, click and focus,
// closes on Escape and outside click, the same contract as ProfileMenu.
export default function ServicesMenu({ variant = 'dropdown' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (variant === 'list') {
    return (
      <div className="services-list">
        {services.map((group) => (
          <div className="services-list__group" key={group.id}>
            <p className="services-list__title">{group.label}</p>
            {group.pages.map((p) => (
              <a className="services-list__link" href={p.href} key={p.href}>
                {p.label}
              </a>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="services"
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="navlink navlink--button services__trigger"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
      >
        Services
        <ChevronDown open={open} />
      </button>

      <div className="services__panel" hidden={!open}>
        {services.map((group) => (
          <div className="services__group" key={group.id}>
            <a className="services__head" href={group.href}>
              <span className="services__label">{group.label}</span>
              <span className="services__tagline">{group.tagline}</span>
            </a>
            <ul className="services__pages">
              {group.pages.map((p) => (
                <li key={p.href}>
                  <a className="services__page" href={p.href}>
                    {p.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
