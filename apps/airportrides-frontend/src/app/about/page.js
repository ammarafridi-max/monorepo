import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PageHero from '@/sections/PageHero';
import { SITE_URL } from '@/config';
import { Car, Globe, Shield, Users } from 'lucide-react';

export const metadata = {
  title: 'About AirportRides – Stress-Free Airport Transfers Worldwide',
  description:
    'AirportRides connects travellers with professional drivers at airports worldwide. Fixed prices, real-time flight tracking, and zero hidden fees.',
  alternates: { canonical: `${SITE_URL}/about` },
};

const paths = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
];

const values = [
  {
    icon: Shield,
    title: 'Fixed, transparent pricing',
    body: 'The price you see is the price you pay. No surge pricing, no meter anxiety, no surprises at the end of your trip.',
  },
  {
    icon: Globe,
    title: 'Global coverage',
    body: 'We partner with vetted operators across 40+ cities worldwide, with new destinations added every month.',
  },
  {
    icon: Car,
    title: 'Flight-aware pickups',
    body: 'We track your flight in real time. If it\'s delayed, your driver knows — and you\'re never charged extra for it.',
  },
  {
    icon: Users,
    title: 'Every kind of traveller',
    body: 'Solo backpackers, business executives, families with car seats, group tours — we have vehicles and services for everyone.',
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About AirportRides"
        subtitle="We believe the journey from airport to destination should be the easiest part of any trip. So we built a transfer service that actually is."
        paths={paths}
      />

      <section className="py-16 md:py-24 bg-sand-50">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-eyebrow uppercase tracking-widest text-clay-600 font-semibold mb-4">
              Our mission
            </p>
            <h2 className="font-display text-h2 text-ink font-semibold leading-tight mb-6">
              Take the stress out of every airport journey
            </h2>
            <p className="text-lead text-ink-soft leading-relaxed">
              Too many travellers land after a long flight and face a chaotic taxi queue, an
              unexpected surge price, or a driver who can&apos;t find them. We started AirportRides
              to fix that — one transfer at a time.
            </p>
            <p className="mt-5 text-lead text-ink-soft leading-relaxed">
              Our platform connects you with professional, licensed drivers at airports worldwide.
              Every booking is confirmed in advance, every price is fixed, and every driver is
              tracking your flight — so when you land, your ride is already waiting.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <p className="text-eyebrow uppercase tracking-widest text-clay-600 font-semibold mb-4">
                Our story
              </p>
              <h2 className="font-display text-h2 text-ink font-semibold leading-tight mb-6">
                Born out of a missed transfer
              </h2>
              <div className="space-y-5 text-ink-soft leading-relaxed">
                <p>
                  Our founder missed a critical connection because the taxi they booked through a
                  hotel app was nowhere to be found after a delayed flight. The driver had given up
                  and left. No notification, no refund, no accountability.
                </p>
                <p>
                  That frustration became AirportRides — a platform built on a simple promise:
                  your driver will be there when you land, regardless of delays, regardless of the
                  hour.
                </p>
                <p>
                  We launched in Dubai in 2024 and have since expanded to 40+ cities across the
                  Middle East, Europe, and Asia, with hundreds of transfers completed every day.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { stat: '40+', label: 'Cities worldwide' },
                { stat: '500+', label: 'Vetted drivers' },
                { stat: '98%', label: 'On-time pickups' },
                { stat: '24/7', label: 'Support coverage' },
              ].map(({ stat, label }) => (
                <div
                  key={label}
                  className="rounded-card bg-sand-100 border border-sand-300 p-6 text-center"
                >
                  <p className="font-display text-4xl font-bold text-clay-600">{stat}</p>
                  <p className="mt-1 text-sm text-ink-soft">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 md:py-24 bg-ink text-sand-100">
        <Container>
          <div className="text-center mb-12">
            <p className="text-eyebrow uppercase tracking-widest text-clay-400 font-semibold mb-4">
              What we stand for
            </p>
            <h2 className="font-display text-h2 font-semibold leading-tight">
              Built on four commitments
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-card bg-white/5 border border-white/10 p-6 flex flex-col gap-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay-600/20">
                  <Icon size={20} className="text-clay-400" />
                </span>
                <h3 className="font-display text-lg font-semibold text-sand-100">{title}</h3>
                <p className="text-sm text-sand-300 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 md:py-20 bg-sand-50">
        <Container>
          <div className="text-center max-w-xl mx-auto">
            <h2 className="font-display text-3xl font-semibold text-ink mb-4">
              Ready for a stress-free transfer?
            </h2>
            <p className="text-ink-soft mb-8">
              Book your airport ride in under two minutes. Fixed price, flight tracking included.
            </p>
            <a
              href="/#book"
              className="inline-block rounded-pill bg-clay-600 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-clay-700"
            >
              Get quotes
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
