'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useLogin } from '@travel-suite/frontend-shared/hooks/auth/useLogin';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoggingIn, getDefaultAdminPath } = useLogin();

  function handleSubmit(e) {
    e.preventDefault();
    login(
      { email: email.trim().toLowerCase(), password },
      {
        onSuccess: (user) => router.push(next || getDefaultAdminPath(user?.role)),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
        >
          Email address
        </label>
        <div className="relative">
          <Mail
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@travelshield.ae"
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
        >
          Password
        </label>
        <div className="relative">
          <Lock
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoggingIn}
        className="mt-1 w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold py-3.5 rounded-xl transition-colors"
      >
        {isLoggingIn ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            Sign in <ArrowRight size={15} />
          </>
        )}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* -- Left panel — brand ------------------------------------------- */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-primary-950 via-primary-900 to-primary-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/2 border border-white/10" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight">
            TravelShield
          </span>
          <span className="ml-1 text-xs font-semibold bg-white/15 text-white/80 px-2 py-0.5 rounded-full border border-white/20">
            Admin
          </span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Manage your
            <br />
            insurance platform
          </h1>
          <p className="text-primary-200 text-base leading-relaxed max-w-sm">
            Access applications, policies, affiliates, content, and financial
            settings from one secure dashboard.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Applications', value: 'All policies' },
              { label: 'Affiliates', value: 'Commission mgmt' },
              { label: 'Blog', value: 'Content tools' },
              { label: 'Currencies', value: 'Live rates' },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-white/10 border border-white/15 rounded-xl p-4"
              >
                <p className="text-xs text-primary-300 font-medium mb-0.5">
                  {label}
                </p>
                <p className="text-sm text-white font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-primary-400">
          Restricted access — authorised personnel only
        </p>
      </div>

      {/* -- Right panel — form ------------------------------------------- */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Shield size={22} className="text-primary-700" />
            <span className="font-extrabold text-gray-900 text-lg">
              TravelShield
            </span>
            <span className="text-xs font-semibold bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full border border-primary-200">
              Admin
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
              Sign in
            </h2>
            <p className="text-sm text-gray-500 mb-7">
              Enter your admin credentials to continue.
            </p>

            {/* Wrapped in Suspense because LoginForm uses useSearchParams */}
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-10">
                  <span className="w-5 h-5 rounded-full border-2 border-primary-200 border-t-primary-700 animate-spin" />
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            <Link href="/" className="hover:text-gray-600 transition">
              ← Back to TravelShield
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
