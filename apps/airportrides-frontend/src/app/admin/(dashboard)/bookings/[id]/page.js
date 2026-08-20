'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Calendar,
  Car,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plane,
  User,
  Users,
} from 'lucide-react';
import { useGetBooking } from '@travel-suite/frontend-shared/hooks/bookings/useGetBooking';
import { useUpdateBookingStatus } from '@travel-suite/frontend-shared/hooks/bookings/useUpdateBookingStatus';

const STATUSES = ['pending_payment', 'paid', 'confirmed', 'completed', 'cancelled'];

const STATUS_CFG = {
  pending_payment: { label: 'Pending payment', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  paid:            { label: 'Paid',            cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  confirmed:       { label: 'Confirmed',        cls: 'bg-green-50 text-green-700 border-green-200' },
  completed:       { label: 'Completed',        cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  cancelled:       { label: 'Cancelled',        cls: 'bg-red-50 text-red-600 border-red-200' },
};

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatTime(str) {
  if (!str) return '—';
  const [h, min] = String(str).split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(min).padStart(2, '0')} ${period}`;
}

function Card({ children, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-gray-200 bg-white ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ children }) {
  return (
    <div className="border-b border-gray-100 px-5 py-4">
      <h3 className="text-sm font-bold text-gray-700">{children}</h3>
    </div>
  );
}

function CardBody({ children }) {
  return <div className="divide-y divide-gray-50 px-5">{children}</div>;
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 flex w-36 shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {Icon && <Icon size={12} />}
        {label}
      </span>
      <span className="min-w-0 flex-1 break-words text-sm leading-5 text-gray-800">{value}</span>
    </div>
  );
}

export default function AdminBookingDetailPage() {
  const { id } = useParams();
  const router  = useRouter();

  const { booking, isLoadingBooking, isErrorBooking } = useGetBooking(id);
  const { updateBookingStatus, isUpdatingStatus } = useUpdateBookingStatus();

  function handleStatusChange(e) {
    const status = e.target.value;
    if (status === booking?.status) return;
    updateBookingStatus({ id, status });
  }

  if (isLoadingBooking) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={22} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (isErrorBooking || !booking) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <AlertCircle size={26} className="text-red-400" />
          <p className="text-sm font-bold text-gray-600">Booking not found</p>
          <button
            onClick={() => router.push('/admin/bookings')}
            className="text-xs font-bold text-primary-700 hover:underline"
          >
            Back to bookings
          </button>
        </div>
      </div>
    );
  }

  const bookingRef = `AR-${String(id).slice(-6).toUpperCase()}`;
  const { passenger, trip, vehicle, status, createdAt } = booking;
  const phone = passenger?.countryCode && passenger?.phone
    ? `${passenger.countryCode} ${passenger.phone}`
    : passenger?.phone || null;

  return (
    <div className="mx-auto max-w-5xl space-y-5">

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/bookings')}
            className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 transition hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="font-mono text-2xl font-extrabold text-gray-900">{bookingRef}</h2>
            <p className="mt-0.5 text-sm text-gray-400">Created {fmtDateTime(createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={status || 'pending_payment'}
            onChange={handleStatusChange}
            disabled={isUpdatingStatus}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_CFG[s]?.label ?? s}
              </option>
            ))}
          </select>
          {isUpdatingStatus && <Loader2 size={16} className="animate-spin text-gray-400" />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        <Card>
          <CardHeader>Trip</CardHeader>
          <CardBody>
            <InfoRow icon={MapPin}   label="Pick up"    value={trip?.pickup?.label} />
            <InfoRow icon={MapPin}   label="Drop off"   value={trip?.dropoff?.label} />
            <InfoRow icon={Calendar} label="Date"       value={fmtDate(trip?.date)} />
            <InfoRow icon={Clock}    label="Time"       value={formatTime(trip?.time)} />
            <InfoRow icon={Users}    label="Passengers" value={trip?.passengers ? `${trip.passengers}` : null} />
            <InfoRow icon={Briefcase} label="Luggage"  value={trip?.luggage ? `${trip.luggage} bag${trip.luggage !== 1 ? 's' : ''}` : null} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>Passenger</CardHeader>
          <CardBody>
            <InfoRow icon={User}          label="Name"     value={`${passenger?.firstName || ''} ${passenger?.lastName || ''}`.trim() || null} />
            <InfoRow icon={Mail}          label="Email"    value={passenger?.email} />
            <InfoRow icon={Phone}         label="Phone"    value={phone} />
            <InfoRow icon={Plane}         label="Flight"   value={passenger?.flightNumber} />
            <InfoRow icon={MessageSquare} label="Notes"    value={passenger?.specialRequests} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>Vehicle & Payment</CardHeader>
          <CardBody>
            <InfoRow icon={Car} label="Vehicle"  value={vehicle?.name ? `${vehicle.name}${vehicle.class ? ` · ${vehicle.class}` : ''}` : null} />
            <InfoRow
              label="Amount"
              value={
                vehicle?.price
                  ? <span className="text-lg font-bold text-gray-900">{vehicle.price.currency} {vehicle.price.amount}</span>
                  : null
              }
            />
            <InfoRow label="Status"   value={STATUS_CFG[status]?.label ?? status} />
            <InfoRow label="Booking ID" value={<span className="font-mono text-xs text-gray-500">{id}</span>} />
          </CardBody>
        </Card>

      </div>
    </div>
  );
}
