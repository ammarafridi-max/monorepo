'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Car,
  Check,
  MapPin,
  Calendar,
  Clock,
  Users,
  Briefcase,
  Plane,
  Phone,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { TransferBookingContext } from '@travel-suite/frontend-shared/contexts/TransferBookingContext';

function formatDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(str) {
  if (!str) return '—';
  const [h, min] = str.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(min).padStart(2, '0')} ${period}`;
}

function SectionHeader({ title, editHref }) {
  return (
    <div className="mb-3 mt-8 flex items-center justify-between first:mt-0">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {editHref && (
        <Link
          href={editHref}
          className="text-xs font-semibold text-clay-600 hover:text-clay-700"
        >
          Edit
        </Link>
      )}
    </div>
  );
}

function ReviewCard({ children }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-sand-200 shadow-warm-sm">
      {children}
    </div>
  );
}

function Row({ icon: Icon, label, value, subtle }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 border-b border-sand-100 px-5 py-3.5 last:border-0">
      {Icon && (
        <span className="mt-0.5 shrink-0">
          <Icon size={13} className="text-clay-500" />
        </span>
      )}
      <div className="flex min-w-0 flex-1 items-baseline justify-between gap-4">
        <span className="shrink-0 text-xs text-ink-mute">{label}</span>
        <span className={`text-right text-sm ${subtle ? 'text-ink-soft' : 'font-medium text-ink'}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const router = useRouter();
  const {
    pickup, dropoff, date, time, passengers, luggage,
    selectedVehicle,
    passengerDetails,
  } = useContext(TransferBookingContext);

  // ── Incomplete state ─────────────────────────────────────────────────────────
  if (!selectedVehicle) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sand-200">
          <Car size={28} className="text-ink-mute" />
        </div>
        <h2 className="text-xl font-semibold text-ink">No vehicle selected</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm font-light leading-relaxed text-ink-soft">
          Please select a vehicle before reviewing your booking.
        </p>
        <Link
          href="/transfer-booking/select-vehicle"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-clay-600 hover:text-clay-700"
        >
          <ArrowLeft size={14} />
          Select a vehicle
        </Link>
      </div>
    );
  }

  if (!passengerDetails) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sand-200">
          <Users size={28} className="text-ink-mute" />
        </div>
        <h2 className="text-xl font-semibold text-ink">Passenger details missing</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm font-light leading-relaxed text-ink-soft">
          Please fill in the passenger details before reviewing your booking.
        </p>
        <Link
          href="/transfer-booking/details"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-clay-600 hover:text-clay-700"
        >
          <ArrowLeft size={14} />
          Enter passenger details
        </Link>
      </div>
    );
  }

  // ── Full review ──────────────────────────────────────────────────────────────
  const { firstName, lastName, email, countryCode, phone, flightNumber, specialRequests } =
    passengerDetails;

  function handleConfirm() {
    router.push('/transfer-booking/payment');
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-ink">Review your booking</h1>
      <p className="mt-1 text-sm font-light text-ink-soft">
        Check everything below before proceeding to payment.
      </p>

      {/* ── Trip details ────────────────────────────────────────────────── */}
      <SectionHeader title="Your trip" editHref="/transfer-booking/select-vehicle" />
      <ReviewCard>
        <Row icon={MapPin}    label="Pick up"    value={pickup?.label} />
        <Row icon={MapPin}    label="Drop off"   value={dropoff?.label} />
        <Row icon={Calendar}  label="Date"       value={formatDate(date)} />
        <Row icon={Clock}     label="Time"       value={formatTime(time)} />
        <Row icon={Users}     label="Passengers" value={`${passengers} ${passengers === 1 ? 'passenger' : 'passengers'}`} />
        <Row icon={Briefcase} label="Luggage"    value={`${luggage} ${luggage === 1 ? 'bag' : 'bags'}`} />
      </ReviewCard>

      {/* ── Vehicle ─────────────────────────────────────────────────────── */}
      <SectionHeader title="Your vehicle" editHref="/transfer-booking/select-vehicle" />
      <ReviewCard>
        <div className="border-b border-sand-100 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-ink">{selectedVehicle.name}</p>
              <p className="mt-0.5 text-xs text-ink-mute">{selectedVehicle.class}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-bold text-ink">
                {selectedVehicle.price.currency} {selectedVehicle.price.amount}
              </p>
              <p className="text-[11px] text-ink-mute">fixed price</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-3.5">
          <p className="mb-2 text-xs text-ink-mute">Included</p>
          <ul className="flex flex-col gap-1.5">
            {selectedVehicle.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-ink-soft">
                <Check size={11} className="shrink-0 text-clay-500" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </ReviewCard>

      {/* ── Passenger details ────────────────────────────────────────────── */}
      <SectionHeader title="Passenger details" editHref="/transfer-booking/details" />
      <ReviewCard>
        <Row icon={Users}  label="Name"          value={`${firstName} ${lastName}`} />
        <Row icon={Mail}   label="Email"         value={email} />
        <Row icon={Phone}  label="Phone"         value={`${countryCode} ${phone}`} />
        <Row icon={Plane}  label="Flight number" value={flightNumber} />
        {specialRequests && (
          <Row icon={MessageSquare} label="Special requests" value={specialRequests} subtle />
        )}
      </ReviewCard>

      {/* ── Confirm ─────────────────────────────────────────────────────── */}
      <div className="mt-8 border-t border-sand-200 pt-6">
        <button
          type="button"
          onClick={handleConfirm}
          className="inline-flex items-center gap-2 rounded-xl bg-clay-600 px-7 py-3.5 text-sm font-semibold text-white shadow-warm-sm transition-colors hover:bg-clay-700"
        >
          Confirm &amp; proceed to payment
          <ArrowRight size={15} />
        </button>
        <p className="mt-3 text-xs text-ink-mute">
          No payment is taken until the next step. You can still go back and edit.
        </p>
      </div>
    </>
  );
}
