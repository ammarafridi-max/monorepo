'use client';

import { useState } from 'react';
import { useAdminAuth } from '../../AdminAuthContext';
import { updateMyProfile, updateMyPassword } from '../../../../lib/adminApi';

export default function AccountPage() {
  const { adminUser, refresh } = useAdminAuth();

  return (
    <>
      <header className="adm-head">
        <h1>Account</h1>
        <p className="adm-muted">
          Signed in as {adminUser?.username} ({adminUser?.role}).
        </p>
      </header>

      <div className="adm-cols">
        <ProfileCard adminUser={adminUser} refresh={refresh} />
        <PasswordCard />
      </div>
    </>
  );
}

function ProfileCard({ adminUser, refresh }) {
  const [name, setName] = useState(adminUser?.name || '');
  const [email, setEmail] = useState(adminUser?.email || '');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMsg('');
    try {
      await updateMyProfile({ name, email });
      await refresh();
      setMsg('Profile updated.');
    } catch (err) {
      setError(err.message || 'Could not update profile.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="adm-card">
      <div className="adm-card__head">
        <h2>Profile</h2>
      </div>
      {error && <p className="adm-login__error">{error}</p>}
      {msg && <p className="adm-ok">{msg}</p>}
      <form className="adm-form" onSubmit={onSubmit}>
        <label className="adm-field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="adm-field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <button type="submit" className="adm-btn" disabled={busy}>
          {busy ? 'Saving' : 'Save profile'}
        </button>
      </form>
    </section>
  );
}

function PasswordCard() {
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMsg('');
    try {
      await updateMyPassword({ passwordCurrent, password, passwordConfirm });
      setMsg('Password changed.');
      setPasswordCurrent('');
      setPassword('');
      setPasswordConfirm('');
    } catch (err) {
      setError(err.message || 'Could not change password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="adm-card">
      <div className="adm-card__head">
        <h2>Password</h2>
      </div>
      {error && <p className="adm-login__error">{error}</p>}
      {msg && <p className="adm-ok">{msg}</p>}
      <form className="adm-form" onSubmit={onSubmit}>
        <label className="adm-field">
          <span>Current password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={passwordCurrent}
            onChange={(e) => setPasswordCurrent(e.target.value)}
            required
          />
        </label>
        <label className="adm-field">
          <span>New password (min 8)</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <label className="adm-field">
          <span>Confirm new password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="adm-btn" disabled={busy}>
          {busy ? 'Saving' : 'Change password'}
        </button>
      </form>
    </section>
  );
}
