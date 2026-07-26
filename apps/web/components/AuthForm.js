'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Shared credentials form for /login and /signup. Posts to the matching route
// handler, then sends the user to their account on success.
export default function AuthForm({ mode }) {
  const router = useRouter();
  const isSignup = mode === 'signup';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/auth/${isSignup ? 'signup' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || 'Something went wrong. Please try again.');
        setBusy(false);
        return;
      }
      router.push('/account');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <div className="field" style={{ marginTop: 0 }}>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="input"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="input"
          type="password"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
        />
      </div>

      <button className="cta" type="submit" disabled={busy}>
        {busy ? 'One moment' : isSignup ? 'Create account' : 'Log in'}
      </button>

      {error && <p className="error">{error}</p>}
    </form>
  );
}
