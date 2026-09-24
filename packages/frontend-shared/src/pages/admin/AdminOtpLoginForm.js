'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import { useOtpLogin } from '../../hooks/useOtpLogin';

const RESEND_SECONDS = 60;
const FIELD =
  'w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition';
const BUTTON =
  'mt-1 w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold py-3.5 rounded-xl transition-colors';
const LABEL = 'text-xs font-semibold text-gray-500 uppercase tracking-wide';

export default function AdminOtpLoginForm({ showForgotLink = true }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef(null);

  const {
    requestCode,
    isRequestingCode,
    verifyCode,
    isVerifyingCode,
    getDefaultAdminPath,
  } = useOtpLogin();

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  const normalizedEmail = email.trim().toLowerCase();

  function send(e) {
    e?.preventDefault();
    requestCode(
      { email: normalizedEmail },
      {
        onSuccess: () => {
          setStep('code');
          setCooldown(RESEND_SECONDS);
        },
      },
    );
  }

  function submitCode(e) {
    e.preventDefault();
    verifyCode(
      { email: normalizedEmail, code: code.trim() },
      { onSuccess: (user) => router.push(next || getDefaultAdminPath(user?.role)) },
    );
  }

  if (step === 'email') {
    return (
      <form onSubmit={send} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={LABEL}>
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
              placeholder="admin@example.com"
              className={FIELD}
            />
          </div>
          <p className="text-xs text-gray-400">
            We will email you a 6-digit code. No password needed.
          </p>
        </div>

        <button type="submit" disabled={isRequestingCode} className={BUTTON}>
          {isRequestingCode ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Sending code…
            </>
          ) : (
            <>
              Send code <ArrowRight size={15} />
            </>
          )}
        </button>

        {showForgotLink && (
          <a
            href="/admin/forgot-password"
            className="text-center text-xs font-semibold text-gray-500 hover:text-gray-700 transition"
          >
            Forgot your password?
          </a>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={submitCode} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="code" className={LABEL}>
          6-digit code
        </label>
        <div className="relative">
          <KeyRound
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            id="code"
            ref={codeRef}
            // One-time-code lets iOS and Chrome autofill straight from the email.
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

      <button type="submit" disabled={isVerifyingCode || code.length !== 6} className={BUTTON}>
        {isVerifyingCode ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Verifying…
          </>
        ) : (
          <>
            Sign in <ArrowRight size={15} />
          </>
        )}
      </button>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => {
            setStep('email');
            setCode('');
          }}
          className="inline-flex items-center gap-1 font-semibold text-gray-500 hover:text-gray-700 transition"
        >
          <ArrowLeft size={13} /> Use a different email
        </button>
        <button
          type="button"
          onClick={send}
          disabled={cooldown > 0 || isRequestingCode}
          className="font-semibold text-primary-700 hover:text-primary-800 disabled:text-gray-300 disabled:cursor-not-allowed transition"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </form>
  );
}
