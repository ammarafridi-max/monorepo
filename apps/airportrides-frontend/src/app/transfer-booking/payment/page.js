'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Car,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Plane,
} from 'lucide-react';
import { getBookingBySessionIdApi } from '@travel-suite/frontend-shared/services/apiBookings';

function formatDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(str) {
  if (!str) return '—';
  const [h, min] = str.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(min).padStart(2, '0')} ${period}`;
}

function Row({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 border-b border-sand-100 px-5 py-3.5 last:border-0">
      <span className="mt-0.5 shrink-0">
        <Icon size={13} className="text-clay-500" />
      </span>
      <div className="flex min-w-0 flex-1 items-baseline justify-between gap-4">
        <span className="shrink-0 text-xs text-ink-mute">{label}</span>
        <span className="text-right text-sm font-medium text-ink">{value}</span>
      </div>
    </div>
  );
}

const NEXT_STEPS = [
  {
    icon: Mail,
    title: 'Confirmation email',
    body: 'A booking confirmation with all details has been sent to your inbox.',
  },
  {
    icon: Car,
    title: 'Driver assignment',
    body: "Your driver will be assigned and you'll receive their name, photo, and contact at least 2 hours before pickup.",
  },
  {
    icon: Plane,
    title: 'Flight tracking',
    body: "We monitor your flight in real time. If it's delayed, your driver adjusts automatically — no extra charge.",
  },
];

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const status    = searchParams.get('status');
  const sessionId = searchParams.get('sessionId');

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(!!sessionId);

  useEffect(() => {
    if (!sessionId) return;
    getBookingBySessionIdApi(sessionId)
      .then((data) => setBooking(data))
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (status !== 'success') {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-ink-soft">No active payment session.</p>
        <Link
          href="/transfer-booking/review"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-clay-600 hover:text-clay-700"
        >
          Back to review
        </Link>
      </div>
    );
  }

  const passenger = booking?.passenger;
  const trip      = booking?.trip;
  const vehicle   = booking?.vehicle;
  const ref       = booking?.bookingRef ? `AR-${booking.bookingRef}` : null;

  return (
    <div className="pb-8">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-clay-100 ring-4 ring-clay-200">
          <CheckCircle2 size={40} className="text-clay-600" />
        </div>
        <h1 className="text-2xl font-semibold text-ink">You're all set!</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm font-light leading-relaxed text-ink-soft">
          {passenger
            ? `Thank you, ${passenger.firstName}. Your airport transfer is confirmed.`
            : 'Your airport transfer is confirmed and ready.'}
        </p>
        {loading ? (
          <div className="mt-4 flex justify-center">
            <Loader2 size={16} className="animate-spin text-clay-500" />
          </div>
        ) : ref ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 ring-1 ring-sand-300">
            <span className="text-xs text-ink-mute">Booking ref</span>
            <span className="font-mono text-sm font-bold text-ink">{ref}</span>
          </div>
        ) : null}
      </div>

      {/* ── Booking summary ─────────────────────────────────────────────── */}
      {!loading && booking && (
        <div className="mb-8 overflow-hidden rounded-2xl bg-white ring-1 ring-sand-200 shadow-warm-sm">
          <div className="border-b border-sand-100 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-mute">
              Booking details
            </p>
          </div>
          <Row icon={MapPin}   label="Pick up"  value={trip?.pickup?.label} />
          <Row icon={MapPin}   label="Drop off" value={trip?.dropoff?.label} />
          <Row icon={Calendar} label="Date"     value={formatDate(trip?.date)} />
          <Row icon={Clock}    label="Time"     value={formatTime(trip?.time)} />
          <Row icon={Car}      label="Vehicle"  value={vehicle?.name} />
          {passenger?.email && (
            <Row icon={Mail}   label="Email"    value={passenger.email} />
          )}
          {passenger?.flightNumber && (
            <Row icon={Plane}  label="Flight"   value={passenger.flightNumber} />
          )}
        </div>
      )}

      {/* ── What happens next ───────────────────────────────────────────── */}
      <h2 className="mb-4 text-base font-semibold text-ink">What happens next</h2>
      <div className="flex flex-col gap-3">
        {NEXT_STEPS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex gap-4 rounded-2xl bg-white px-5 py-4 ring-1 ring-sand-200 shadow-warm-sm"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-clay-100">
              <Icon size={16} className="text-clay-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-xs font-light leading-relaxed text-ink-soft">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-col items-start gap-4 border-t border-sand-200 pt-6 sm:flex-row sm:items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-clay-600 px-7 py-3.5 text-sm font-semibold text-white shadow-warm-sm transition-colors hover:bg-clay-700"
        >
          Book another ride
          <ArrowRight size={15} />
        </Link>
        <Link href="/" className="text-sm font-semibold text-ink-soft hover:text-ink">
          Back to home
        </Link>
      </div>
    </div>
  );
}
