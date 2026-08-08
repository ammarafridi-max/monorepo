'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MailCheck, ArrowRight, Loader2 } from 'lucide-react';
import Container from '../../components/shared/layout/Container.js';
import { useRequestMagicLink } from '../../hooks/visa-applications/useVisaAppMutations.js';

export default function ApplyLoginPage() {
  const params = useSearchParams();
  const linkExpired = params?.get('error') === 'expired';
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { mutate, isPending } = useRequestMagicLink();

  function onSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    mutate(email.trim(), { onSettled: () => setSent(true) });
  }

  return (
    <section className="min-h-[70vh] flex items-center py-16 bg-gray-50">
      <Container className="max-w-md">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <MailCheck className="text-primary-600" size={22} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h1>
              <p className="text-sm text-gray-500 leading-relaxed">
                If <span className="font-medium text-gray-700">{email}</span> is valid, we've sent a secure sign-in
                link. It's valid for 20 minutes. You can close this tab.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-6 text-sm font-medium text-primary-700 hover:text-primary-800"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Sign in to your application</h1>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email and we'll send you a secure sign-in link. No password needed.
              </p>
              {linkExpired && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
                  That link has expired or was already used. Enter your email to get a new one.
                </div>
              )}
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <>Send sign-in link <ArrowRight size={16} /></>}
                </button>
              </form>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
