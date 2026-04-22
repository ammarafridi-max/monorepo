'use client';

import { useState } from 'react';
import { User, Lock, Eye, EyeOff, Loader2, Save, ShieldCheck, Mail, BadgeCheck, Clock3 } from 'lucide-react';
import { useGetMyAccount }     from '@travel-suite/frontend-shared/hooks/account/useGetMyAccount';
import { useUpdateMyAccount }  from '@travel-suite/frontend-shared/hooks/account/useUpdateMyAccount';
import { useUpdateMyPassword } from '@travel-suite/frontend-shared/hooks/account/useUpdateMyPassword';

/* --- UI primitives ----------------------------------------------------------- */

const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 transition disabled:bg-gray-50 disabled:text-gray-400';

function Card({ title, icon: Icon, description, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <Icon size={15} className="text-primary-700" />
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{title}</p>
            {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
          </div>
        </div>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function roleLabel(role) {
  if (!role) return '—';
  return role
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function OverviewCard({ account }) {
  const items = [
    {
      label: 'Role',
      value: roleLabel(account?.role),
      icon: BadgeCheck,
    },
    {
      label: 'Status',
      value: account?.status || '—',
      icon: ShieldCheck,
    },
    {
      label: 'Member Since',
      value: formatDate(account?.createdAt),
      icon: Clock3,
    },
    {
      label: 'Last Updated',
      value: formatDate(account?.updatedAt),
      icon: Mail,
    },
  ];

  return (
    <Card
      title="Account Overview"
      icon={ShieldCheck}
      description="Your admin identity and account status at a glance."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Icon size={14} />
              <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* --- Profile form ------------------------------------------------------------- */

function ProfileForm({ account }) {
  const { updateAccount, isUpdating } = useUpdateMyAccount();

  const [form, setForm] = useState(() => ({
    name: account?.name ?? '',
    email: account?.email ?? '',
    username: account?.username ?? '',
  }));

  function set(key, val) { setForm((p) => ({ ...p, [key]: val })); }

  function handleSubmit(e) {
    e.preventDefault();
    updateAccount({ name: form.name.trim(), email: form.email.trim() });
  }

  const isDirty =
    form.name     !== (account?.name     ?? '') ||
    form.email    !== (account?.email    ?? '');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name">
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Your name"
            className={inputCls}
            required
          />
        </Field>
        <Field label="Username" hint="Username cannot be changed.">
          <input
            type="text"
            value={form.username}
            disabled
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Email Address">
        <input
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="you@example.com"
          className={inputCls}
          required
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Role" hint="Roles are managed by another admin.">
          <input
            type="text"
            value={roleLabel(account?.role)}
            disabled
            className={inputCls}
          />
        </Field>
        <Field label="Status" hint="Inactive users cannot sign in.">
          <input
            type="text"
            value={account?.status ?? ''}
            disabled
            className={inputCls}
          />
        </Field>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!isDirty || isUpdating}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {isUpdating ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

/* --- Password form ------------------------------------------------------------ */

function PasswordForm() {
  const { updatePassword, isUpdating } = useUpdateMyPassword();

  const [form, setForm]   = useState({ currentPassword: '', password: '', passwordConfirm: '' });
  const [show, setShow]   = useState({ current: false, next: false, confirm: false });

  function set(key, val) { setForm((p) => ({ ...p, [key]: val })); }
  function toggleShow(key) { setShow((p) => ({ ...p, [key]: !p[key] })); }

  const passwordsMatch = form.password === form.passwordConfirm;
  const hasUppercase = /[A-Z]/.test(form.password);
  const hasLowercase = /[a-z]/.test(form.password);
  const hasNumber = /\d/.test(form.password);
  const canSubmit =
    form.currentPassword &&
    form.password.length >= 8 &&
    passwordsMatch &&
    hasUppercase &&
    hasLowercase &&
    hasNumber;

  async function handleSubmit(e) {
    e.preventDefault();
    await updatePassword({
      currentPassword: form.currentPassword,
      password:        form.password,
      passwordConfirm: form.passwordConfirm,
    });
    setForm({ currentPassword: '', password: '', passwordConfirm: '' });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Current Password">
        <div className="relative">
          <input
            type={show.current ? 'text' : 'password'}
            value={form.currentPassword}
            onChange={(e) => set('currentPassword', e.target.value)}
            placeholder="Enter current password"
            className={`${inputCls} pr-10`}
            required
          />
          <button type="button" onClick={() => toggleShow('current')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
            {show.current ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="New Password" hint="Minimum 8 characters.">
          <div className="relative">
            <input
              type={show.next ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder="New password"
              minLength={8}
              className={`${inputCls} pr-10`}
              required
            />
            <button type="button" onClick={() => toggleShow('next')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
              {show.next ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>

        <Field label="Confirm New Password">
          <div className="relative">
            <input
              type={show.confirm ? 'text' : 'password'}
              value={form.passwordConfirm}
              onChange={(e) => set('passwordConfirm', e.target.value)}
              placeholder="Repeat new password"
              className={`${inputCls} pr-10 ${form.passwordConfirm && !passwordsMatch ? 'border-red-300 focus:ring-red-400' : ''}`}
              required
            />
            <button type="button" onClick={() => toggleShow('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
              {show.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {form.passwordConfirm && !passwordsMatch && (
            <p className="text-[11px] text-red-500 mt-1">Passwords do not match.</p>
          )}
        </Field>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">
          Password Requirements
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <p className={form.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}>At least 8 characters</p>
          <p className={hasUppercase ? 'text-green-600' : 'text-gray-400'}>One uppercase letter</p>
          <p className={hasNumber ? 'text-green-600' : 'text-gray-400'}>One number</p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!canSubmit || isUpdating}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />}
          {isUpdating ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </form>
  );
}

/* --- Page --------------------------------------------------------------------- */

export default function AccountPage() {
  const { account, isLoading } = useGetMyAccount();

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">My Account</h2>
        <p className="text-sm text-gray-400 mt-0.5">Manage your profile and password.</p>
      </div>

      {/* Profile card */}
      {!isLoading && account && <OverviewCard account={account} />}

      <Card
        title="Profile Information"
        icon={User}
        description="Update your name and email address."
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : (
          <ProfileForm key={account?._id || account?.username || 'account'} account={account} />
        )}
      </Card>

      {/* Password card */}
      <Card
        title="Change Password"
        icon={Lock}
        description="Choose a strong password with at least 8 characters."
      >
        <PasswordForm />
      </Card>

    </div>
  );
}
