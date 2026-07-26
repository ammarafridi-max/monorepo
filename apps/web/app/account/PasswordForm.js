'use client';

import { useState } from 'react';

// Change (or, for a social-only account, set for the first time) the account
// password. Posts to /api/account/password; the session cookie authenticates the
// request. `hasPassword` decides whether the current password is required.
export default function PasswordForm({ hasPassword }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setDone(false);
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || 'Could not update your password. Please try again.');
        setBusy(false);
        return;
      }
      setDone(true);
      setCurrent('');
      setNext('');
    } catch {
      setError('Could not reach the server. Please try again.');
    }
    setBusy(false);
  }

  return (
    <form className="acct-form" onSubmit={onSubmit}>
      {hasPassword && (
        <div className="field">
          <label className="label" htmlFor="current-password">
            Current password
          </label>
          <input
            id="current-password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
      )}
      <div className="field">
        <label className="label" htmlFor="new-password">
          {hasPassword ? 'New password' : 'Create a password'}
        </label>
        <input
          id="new-password"
          className="input"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </div>

      {error && <p className="error">{error}</p>}
      {done && <p className="acct-ok">Password updated.</p>}

      <button className="btn btn--primary" type="submit" disabled={busy || next.length < 8}>
        {busy ? 'Saving' : hasPassword ? 'Update password' : 'Set password'}
      </button>
    </form>
  );
}
