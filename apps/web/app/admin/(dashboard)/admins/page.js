'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '../../AdminAuthContext';
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  setAdminUserPassword,
  dateOnly,
} from '../../../../lib/adminApi';

const ROLES = ['admin', 'support'];
const STATUSES = ['ACTIVE', 'INACTIVE'];

export default function AdminsPage() {
  const { adminUser } = useAdminAuth();
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // { type: 'create'|'edit'|'password', user }
  const [busyUser, setBusyUser] = useState('');

  const load = useCallback(() => {
    setError('');
    getAdminUsers(filters)
      .then(setUsers)
      .catch((e) => setError(e.message || 'Could not load the team.'));
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  async function quickToggleStatus(u) {
    setBusyUser(u.username);
    try {
      await updateAdminUser(u.username, { status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
      load();
    } catch (e) {
      setError(e.message || 'Could not update status.');
    } finally {
      setBusyUser('');
    }
  }

  async function remove(u) {
    if (!window.confirm(`Delete ${u.username}? This cannot be undone.`)) return;
    setBusyUser(u.username);
    try {
      await deleteAdminUser(u.username);
      load();
    } catch (e) {
      setError(e.message || 'Could not delete this admin.');
    } finally {
      setBusyUser('');
    }
  }

  return (
    <>
      <header className="adm-head adm-head--row">
        <div>
          <h1>Team</h1>
          <p className="adm-muted">
            {users ? `${users.length} staff accounts.` : 'Loading team.'} Admins manage everything;
            support is read-only.
          </p>
        </div>
        <div className="adm-head__aside">
          <button type="button" className="adm-btn adm-btn--sm" onClick={() => setModal({ type: 'create' })}>
            New admin
          </button>
        </div>
      </header>

      <div className="adm-filters">
        <label className="adm-field adm-field--inline">
          <span>Search</span>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="name, username, email"
          />
        </label>
        <label className="adm-field adm-field--inline">
          <span>Role</span>
          <select value={filters.role} onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}>
            <option value="">All</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="adm-field adm-field--inline">
          <span>Status</span>
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="adm-error">{error}</p>}

      {users && (
        <div className="adm-tablewrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th className="adm-actions-h">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.username === adminUser?.username;
                const busy = busyUser === u.username;
                return (
                  <tr key={u.username} className={u.status === 'INACTIVE' ? 'adm-row--muted' : undefined}>
                    <td>
                      {u.name}
                      {isSelf && <span className="adm-selftag">you</span>}
                    </td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`pill${u.role === 'admin' ? ' pill--ok' : ''}`}>{u.role}</span>
                    </td>
                    <td>
                      <span className={`pill${u.status === 'INACTIVE' ? ' pill--warn' : ''}`}>
                        {u.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{dateOnly(u.createdAt)}</td>
                    <td className="adm-actions">
                      <button type="button" className="adm-mini" onClick={() => setModal({ type: 'edit', user: u })}>
                        Edit
                      </button>
                      <button type="button" className="adm-mini" onClick={() => setModal({ type: 'password', user: u })}>
                        Password
                      </button>
                      <button
                        type="button"
                        className="adm-mini"
                        disabled={isSelf || busy}
                        title={isSelf ? 'You cannot change your own status here' : ''}
                        onClick={() => quickToggleStatus(u)}
                      >
                        {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className="adm-mini adm-mini--danger"
                        disabled={isSelf || busy}
                        title={isSelf ? 'You cannot delete yourself' : ''}
                        onClick={() => remove(u)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="adm-muted">
                    No staff match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal?.type === 'create' && (
        <UserModal
          title="New admin"
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
      {modal?.type === 'edit' && (
        <UserModal
          title={`Edit ${modal.user.username}`}
          user={modal.user}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
      {modal?.type === 'password' && (
        <PasswordModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSaved={() => setModal(null)}
        />
      )}
    </>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="adm-modal" onClick={onClose}>
      <div className="adm-modal__card" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal__head">
          <h2>{title}</h2>
          <button type="button" className="adm-modal__x" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function UserModal({ title, user, onClose, onSaved }) {
  const editing = Boolean(user);
  const [form, setForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'support',
    status: user?.status || 'ACTIVE',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (editing) {
        await updateAdminUser(user.username, {
          name: form.name,
          email: form.email,
          role: form.role,
          status: form.status,
        });
      } else {
        await createAdminUser({
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
          status: form.status,
        });
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not save.');
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      {error && <p className="adm-login__error">{error}</p>}
      <form className="adm-form" onSubmit={onSubmit}>
        <label className="adm-field">
          <span>Name</span>
          <input value={form.name} onChange={set('name')} required />
        </label>
        {!editing && (
          <label className="adm-field">
            <span>Username (8 to 50, lowercase)</span>
            <input value={form.username} onChange={set('username')} required />
          </label>
        )}
        <label className="adm-field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={set('email')} required />
        </label>
        {!editing && (
          <label className="adm-field">
            <span>Password (min 8)</span>
            <input type="password" value={form.password} onChange={set('password')} required />
          </label>
        )}
        <div className="adm-form__row">
          <label className="adm-field">
            <span>Role</span>
            <select value={form.role} onChange={set('role')}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="adm-field">
            <span>Status</span>
            <select value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" className="adm-btn" disabled={busy}>
          {busy ? 'Saving' : editing ? 'Save changes' : 'Create admin'}
        </button>
      </form>
    </Modal>
  );
}

function PasswordModal({ user, onClose, onSaved }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await setAdminUserPassword(user.username, password, confirm);
      setDone(true);
      setTimeout(onSaved, 900);
    } catch (err) {
      setError(err.message || 'Could not update the password.');
      setBusy(false);
    }
  }

  return (
    <Modal title={`Reset password for ${user.username}`} onClose={onClose}>
      {done ? (
        <p className="adm-muted">Password updated. Their existing sessions are now signed out.</p>
      ) : (
        <>
          {error && <p className="adm-login__error">{error}</p>}
          <form className="adm-form" onSubmit={onSubmit}>
            <label className="adm-field">
              <span>New password (min 8)</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            <label className="adm-field">
              <span>Confirm password</span>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </label>
            <button type="submit" className="adm-btn" disabled={busy}>
              {busy ? 'Saving' : 'Set password'}
            </button>
          </form>
        </>
      )}
    </Modal>
  );
}
