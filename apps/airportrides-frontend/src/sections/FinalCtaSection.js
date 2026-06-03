'use client';

import { useState } from 'react';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import { ArrowRight } from 'lucide-react';

export default function FinalCtaSection({
  title = 'Ready for a smoother arrival?',
  subtitle = 'Book your airport transfer in minutes and start your trip the easy way.',
  ctaHref = '#book',
  ctaLabel = 'Find your transfer',
  notifyLabel = 'Or get notified when we launch in your city',
  notifyBtnLabel = 'Notify me',
}) {
  const [email, setEmail] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: replace with email-capture call (Brevo contact create).
    console.log('Launch notify signup:', email);
    setEmail('');
  }

  return (
    <section id="launch" className="scroll-mt-24 px-4 py-12 md:py-16">
      <Container>
        <div
          className="grain relative overflow-hidden rounded-panel px-6 py-16 text-center md:px-12 md:py-20"
          style={{
            backgroundImage:
              'radial-gradient(100% 120% at 0% 0%, #3f6aeb 0%, #2f5be6 45%, #2449c4 100%)',
          }}
        >
          <h2 className="mx-auto max-w-2xl text-h2 font-semibold text-sand-50">{title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lead font-light text-sand-100/85">{subtitle}</p>

          <div className="mt-8 flex justify-center">
            <a
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-pill bg-sand-50 px-7 py-4 text-base font-semibold text-clay-700 shadow-warm-sm transition-all duration-200 hover:bg-white hover:shadow-warm"
            >
              {ctaLabel}
              <ArrowRight size={18} />
            </a>
          </div>

          <form onSubmit={handleSubmit} className="mx-auto mt-12 max-w-md">
            <label htmlFor="launch-email" className="block text-sm font-light text-sand-100/85">
              {notifyLabel}
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                id="launch-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-pill border border-white/25 bg-white/10 px-5 py-3.5 text-sm text-white placeholder:text-sand-100/60 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <button
                type="submit"
                className="shrink-0 rounded-pill bg-ink px-6 py-3.5 text-sm font-semibold text-sand-50 transition-colors duration-200 hover:bg-clay-900"
              >
                {notifyBtnLabel}
              </button>
            </div>
          </form>
        </div>
      </Container>
    </section>
  );
}
