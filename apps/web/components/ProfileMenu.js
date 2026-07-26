'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * The authed nav identity: an avatar + first name + chevron in a rounded trigger
 * that opens a dropdown with "Account" and "Log Out".
 *
 * NOTE ON DATA: there is no stored display name or avatar image — the session only
 * carries the email. So we DERIVE a friendly first name and an initial from the
 * email's local-part. Real name/photo would require capturing them during OAuth
 * (e.g. Google's profile scope) and persisting a `User.name` / `User.picture`
 * field; until then the email is all we have.
 *
 * Opens three ways so it works on desktop, touch, and keyboard:
 *  - HOVER: mouse-enter on the wrapper opens it (a transparent bridge keeps it
 *    open while the pointer crosses the gap into the panel).
 *  - CLICK: the trigger button toggles it (touch has no hover).
 *  - FOCUS: tabbing onto the trigger opens it; Escape / outside-click closes.
 */

// First name = the leading run of letters before the first separator (. _ + -) or
// digit, capitalized. Initial = its first letter. e.g. "ammar.afridi95" -> Ammar / A.
function deriveIdentity(email) {
  const local = String(email || '').split('@')[0] || '';
  const match = local.match(/^[a-zA-Z]+/);
  const raw = match ? match[0] : local;
  const first = raw
    ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
    : 'Account';
  const initial = (raw || local || '?').charAt(0).toUpperCase();
  return { first, initial };
}

function ChevronDown({ open }) {
  return (
    <svg
      className={`profile__chev${open ? ' profile__chev--open' : ''}`}
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

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="5" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3 13.2c0-2.4 2.2-3.9 5-3.9s5 1.5 5 3.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M6.25 2.75H3.25v10.5h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.25 5l3 3-3 3M12.25 8H6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProfileMenu({ email }) {
  const { first, initial } = deriveIdentity(email);
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

  return (
    <div
      className="profile"
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="profile__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
      >
        <span className="profile__avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="profile__name">{first}</span>
        <ChevronDown open={open} />
      </button>

      <div className="profile__menu" role="menu" hidden={!open}>
        <a className="profile__item" href="/account" role="menuitem">
          <UserIcon />
          <span>Account</span>
        </a>
        <form action="/api/auth/logout" method="post" className="profile__logout">
          <button
            className="profile__item profile__item--button"
            type="submit"
            role="menuitem"
          >
            <LogoutIcon />
            <span>Log Out</span>
          </button>
        </form>
      </div>
    </div>
  );
}
