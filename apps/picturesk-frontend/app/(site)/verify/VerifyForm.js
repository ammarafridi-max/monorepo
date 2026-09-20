'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyForm({ next }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || 'Something went wrong. Please try again.');
        setBusy(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  async function resend() {
    setError('');
    setNote('');
    const res = await fetch('/api/auth/verify/resend', { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) setError(body.error || 'Could not resend. Try again in a minute.');
    else setNote('Sent. Check your inbox and your spam folder.');
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <div className="field" style={{ marginTop: 0 }}>
        <label className="label" htmlFor="code">
          Six-digit code
        </label>
        <input
          id="code"
          className="input input--code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          disabled={busy}
          autoFocus
        />
      </div>
      <button className="cta" type="submit" disabled={busy || code.length !== 6}>
        {busy ? 'One moment' : 'Verify and continue'}
      </button>
      <p className="formnote" style={{ textAlign: 'left' }}>
        No email after a minute?{' '}
        <button type="button" className="linkbtn" onClick={resend} disabled={busy}>
          Send a new code
        </button>
      </p>
      {note && <p className="formnote formnote--left">{note}</p>}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
