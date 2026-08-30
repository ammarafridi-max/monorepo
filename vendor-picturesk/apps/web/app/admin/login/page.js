'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminLogin } from '../../../lib/adminApi';

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await adminLogin({ email: email.trim().toLowerCase(), password });
      // Navigating into the guarded area mounts AdminAuthProvider fresh, which
      // re-reads the session from the new cookie. router.refresh syncs server state.
      router.replace(next || '/admin');
      router.refresh();
    } catch (err) {
      setError(
        err.status === 401 || err.status === 403
          ? err.message || 'Incorrect email or password.'
          : 'Could not sign you in. Please try again.'
      );
      setBusy(false);
    }
  }

  return (
    <div className="adm-login">
      <div className="adm-login__card">
        <div className="adm-brandrow adm-brandrow--center">
          <span className="adm-brand adm-brand--ink">Picturesk</span>
          <span className="adm-tag adm-tag--ink">Admin</span>
        </div>
        <h1 className="adm-login__title">Sign in.</h1>
        <p className="adm-login__sub">Staff access to orders and metrics.</p>

        {error && <p className="adm-login__error">{error}</p>}

        <form onSubmit={onSubmit} className="adm-form">
          <label className="adm-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="adm-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="adm-btn" disabled={busy}>
            {busy ? 'Signing in' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<div className="adm-boot">Loading</div>}>
      <LoginForm />
    </Suspense>
  );
}
