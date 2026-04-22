'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import {
  User,
  Mail,
  LogOut,
  Save,
  Loader2,
  ShieldCheck,
  FileText,
  Clock,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { FaGoogle, FaFacebook } from 'react-icons/fa6';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@travel-suite/frontend-shared/contexts/UserAuthContext';
import { updateAccountApi } from '@travel-suite/frontend-shared/services/apiAccount';
import { logoutUserSessionApi } from '@travel-suite/frontend-shared/services/apiAuth';
import toast from 'react-hot-toast';

const inputCls =
  'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 transition disabled:bg-gray-50 disabled:text-gray-400';

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
            {description && (
              <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            )}
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
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function ProviderBadge({ provider }) {
  if (provider === 'google' || !provider) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
        <FaGoogle size={10} className="text-[#4285F4]" />
        Google account
      </span>
    );
  }
  if (provider === 'facebook') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
        <FaFacebook size={10} className="text-[#1877F2]" />
        Facebook account
      </span>
    );
  }
  return null;
}

function Avatar({ user, size = 64 }) {
  if (user?.image) {
    return (
      <Image
        src={user.image}
        alt={user.name ?? 'User'}
        width={size}
        height={size}
        className="rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }
  const initials = (user?.name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-primary-700 flex items-center justify-center text-white font-bold text-xl shrink-0"
    >
      {initials}
    </div>
  );
}

function ProfileForm({ user }) {
  const { setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  const isDirty = name.trim() !== (user?.name ?? '').trim();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isDirty) return;
    setIsSaving(true);
    try {
      const updatedUser = await updateAccountApi({ name: name.trim() });
      setUser(updatedUser);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      toast.error(error.message || 'Could not update your profile');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Full Name">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className={inputCls}
          required
          maxLength={100}
        />
      </Field>

      <Field
        label="Email Address"
        hint="Your email is managed by your sign-in provider and cannot be changed here."
      >
        <input
          type="email"
          value={user?.email ?? ''}
          disabled
          className={inputCls}
        />
      </Field>

      <Field label="Sign-in Method">
        <div className="flex items-center gap-2 py-2">
          <ProviderBadge
            provider={
              user?.authProvider === 'oauth' ? 'google' : user?.provider
            }
          />
          <p className="text-[11px] text-gray-400">
            Passwords are managed by your sign-in provider.
          </p>
        </div>
      </Field>

      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && (
          <p className="text-xs text-emerald-600 font-semibold">
            Changes saved!
          </p>
        )}
        <button
          type="submit"
          disabled={!isDirty || isSaving}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Save size={13} />
          )}
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

function ComingSoon({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
        <Clock size={20} className="text-gray-300" />
      </div>
      <p className="text-sm font-semibold text-gray-400">Coming soon</p>
      <p className="text-xs text-gray-300 mt-1 max-w-xs">{message}</p>
    </div>
  );
}

function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await logoutUserSessionApi();
    } catch (error) {
      void error;
    }
    await signOut({ callbackUrl: '/' });
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <LogOut size={13} />
      )}
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  );
}

export default function AccountPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar user={user} size={56} />
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">
              {user?.name ?? 'My Account'}
            </h1>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>
        <SignOutButton />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Policies', value: '—', icon: ShieldCheck },
          { label: 'Purchases', value: '—', icon: FileText },
          { label: 'Saved Quotes', value: '—', icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4"
          >
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
              <Icon size={16} className="text-primary-700" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <Card
        title="Profile Information"
        icon={User}
        description="Update your display name."
      >
        <ProfileForm user={user} />
      </Card>

      <Card
        title="My Policies"
        icon={ShieldCheck}
        description="Active and past travel insurance policies purchased through TravelShield."
      >
        <ComingSoon message="Your purchased policies will appear here. Buy your first policy to get started." />
        <div className="flex justify-center mt-2">
          <Link
            href="/insurance-booking/quote"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-900 transition-colors"
          >
            Get a quote <ChevronRight size={13} />
          </Link>
        </div>
      </Card>

      <Card
        title="Purchase History"
        icon={FileText}
        description="A full record of all purchases made through your account."
      >
        <ComingSoon message="All payments and transactions will be listed here once you make a purchase." />
      </Card>

      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
        <Lock size={15} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          Your account is secured via OAuth 2.0 through your Google or Facebook
          account. TravelShield never stores your password.
        </p>
      </div>
    </div>
  );
}
