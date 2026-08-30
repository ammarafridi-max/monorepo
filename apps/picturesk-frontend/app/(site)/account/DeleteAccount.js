'use client';

import { useState } from 'react';

// Delete the account (login) via DELETE /api/account. Two-step and type-to-confirm
// so it can never fire by accident: the destructive button is disabled until the
// user types DELETE. Orders revert to anonymous; stored photos are kept (full
// erasure is a support request, stated in the copy).
export default function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onDelete() {
    if (busy || confirm !== 'DELETE') return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Could not delete your account. Please try again.');
        setBusy(false);
        return;
      }
      // Account and session are gone; leave the gated area.
      window.location.href = '/';
    } catch {
      setError('Could not reach the server. Please try again.');
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn btn--danger" onClick={() => setOpen(true)}>
        Delete account
      </button>
    );
  }

  return (
    <div className="acct-confirm">
      <p className="acct-confirm__note">
        This removes your login and unlinks your orders. Your delivered headshots stay
        downloadable from their links. To also erase your uploaded photos and results,{' '}
        <a href="/contact">contact us</a>. This cannot be undone.
      </p>
      <label className="label" htmlFor="delete-confirm">
        Type DELETE to confirm
      </label>
      <input
        id="delete-confirm"
        className="input"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="off"
        spellCheck="false"
      />
      {error && <p className="error">{error}</p>}
      <div className="acct-confirm__actions">
        <button type="button" className="btn btn--link" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn--danger"
          disabled={busy || confirm !== 'DELETE'}
          onClick={onDelete}
        >
          {busy ? 'Deleting' : 'Permanently delete'}
        </button>
      </div>
    </div>
  );
}
