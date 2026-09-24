'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { usePasswordReset } from '../../hooks/usePasswordReset';

const RESEND_SECONDS = 60;
const FIELD =
  'w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition';
const BUTTON =
  'mt-1 w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold py-3.5 rounded-xl transition-colors';
const LABEL = 'text-xs font-semibold text-gray-500 uppercase tracking-wide';
const SPINNER = 'w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin';

export default function AdminForgotPasswordForm({ loginHref = '/admin/login' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef(null);

  const {
    requestReset,
    isRequestingReset,
    resetPassword,
    isResettingPassword,
    getDefaultAdminPath,
  } = usePasswordReset();

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === 'reset') codeRef.current?.focus();
  }, [step]);

  const normalizedEmail = email.trim().toLowerCase();

  function send(e) {
    e?.preventDefault();
    requestReset(
      { email: normalizedEmail },
      {
        onSuccess: () => {
          setStep('reset');
          setCooldown(RESEND_SECONDS);
        },
      },
    );
  }

  function submit(e) {
    e.preventDefault();
    resetPassword(
      { email: normalizedEmail, code: code.trim(), password },
      { onSuccess: (user) => router.push(next || getDefaultAdminPath(user?.role)) },
    );
  }

  if (step === 'email') {
    return (
      <form onSubmit={send} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reset-email" className={LABEL}>
            Email address
          </label>
          <div className="relative">
            <Mail
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className={FIELD}
            />
          </div>
          <p className="text-xs text-gray-400">
            We will email you a 6-digit code to set a new password.
          </p>
        </div>

        <button type="submit" disabled={isRequestingReset} className={BUTTON}>
          {isRequestingReset ? (
            <>
              <span className={SPINNER} />
              Sending code…
            </>
          ) : (
            <>
              Send reset code <ArrowRight size={15} />
            </>
          )}
        </button>

        <a
          href={loginHref}
          className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 transition"
        >
          <ArrowLeft size={13} /> Back to sign in
        </a>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reset-code" className={LABEL}>
          6-digit code
        </label>
        <div className="relative">
          <KeyRound
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            id="reset-code"
            ref={codeRef}
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            className={`${FIELD} tracking-[0.4em] font-bold`}
          />
        </div>
        <p className="text-xs text-gray-400">
          Sent to {normalizedEmail}. It expires in 10 minutes.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-password" className={LABEL}>
          New password
        </label>
        <div className="relative">
          <Lock
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            id="new-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={`${FIELD} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Setting a new password signs you out everywhere else.
        </p>
      </div>

      <button
        type="submit"
        disabled={isResettingPassword || code.length !== 6 || password.length < 8}
        className={BUTTON}
      >
        {isResettingPassword ? (
          <>
            <span className={SPINNER} />
            Updating…
          </>
        ) : (
          <>
            Set new password <ArrowRight size={15} />
          </>
        )}
      </button>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => {
            setStep('email');
            setCode('');
            setPassword('');
          }}
          className="inline-flex items-center gap-1 font-semibold text-gray-500 hover:text-gray-700 transition"
        >
          <ArrowLeft size={13} /> Use a different email
        </button>
        <button
          type="button"
          onClick={send}
          disabled={cooldown > 0 || isRequestingReset}
          className="font-semibold text-primary-700 hover:text-primary-800 disabled:text-gray-300 disabled:cursor-not-allowed transition"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </form>
  );
}
