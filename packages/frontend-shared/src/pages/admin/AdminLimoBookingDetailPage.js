'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertCircle,
  Car,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plane,
  RotateCcw,
  Trash2,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { useGetBooking } from '../../hooks/limo-bookings/useGetBooking';
import { useUpdateBooking } from '../../hooks/limo-bookings/useUpdateBooking';
import { useDeleteBooking } from '../../hooks/limo-bookings/useDeleteBooking';
import { useRefundBooking } from '../../hooks/limo-bookings/useRefundBooking';

const STATUSES = [
  'pending',
  'confirmed',
  'assigned',
  'in-progress',
  'completed',
  'cancelled',
];

function fmtFull(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ children }) {
  return (
    <div className="px-5 py-4 border-b border-gray-100">
      <h3 className="text-sm font-bold text-gray-700">{children}</h3>
    </div>
  );
}

function CardBody({ children, className = '' }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide w-36 shrink-0 mt-0.5">
        {Icon && <Icon size={13} />}
        {label}
      </span>
      <span className="text-sm text-gray-800 leading-5 flex-1 min-w-0 break-words">
        {value ?? '—'}
      </span>
    </div>
  );
}

export default function AdminLimoBookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { booking, isLoadingBooking, isErrorBooking } = useGetBooking(id);
  const { updateBooking, isUpdatingBooking } = useUpdateBooking();
  const { deleteBooking, isDeletingBooking } = useDeleteBooking();
  const { refundBooking, isRefundingBooking } = useRefundBooking();

  if (isLoadingBooking) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={22} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (isErrorBooking || !booking) {
    return (
      <div className="max-w-3xl mx-auto">
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

  const bd = booking.bookingDetails || {};
  const phone = bd.phoneNumber
    ? `${bd.phoneNumber.code || ''} ${bd.phoneNumber.number || ''}`.trim()
    : '—';
  const isPaid = (booking.payment?.status || '').toLowerCase() === 'paid';
  const transactionId = booking.payment?.transactionId;

  function handleStatusChange(e) {
    const status = e.target.value;
    if (status === booking.status) return;
    updateBooking({ id, bookingData: { status } });
  }

  function handleRefund() {
    if (!transactionId) return;
    refundBooking(transactionId);
  }

  function handleDelete() {
    deleteBooking(id, { onSuccess: () => router.push('/admin/bookings') });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/bookings')}
            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition"
            title="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 font-mono">
              {booking.bookingRef || '—'}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5 capitalize">
              {booking.tripType} trip • created {fmtDate(booking.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={booking.status || 'pending'}
            onChange={handleStatusChange}
            disabled={isUpdatingBooking}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white capitalize disabled:opacity-50"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>

          {isPaid && transactionId && (
            <button
              onClick={handleRefund}
              disabled={isRefundingBooking}
              className="flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition"
            >
              {isRefundingBooking ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RotateCcw size={14} />
              )}
              Refund
            </button>
          )}

          {confirmDelete ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-red-600 font-semibold whitespace-nowrap">Delete?</span>
              <button
                onClick={handleDelete}
                disabled={isDeletingBooking}
                className="font-bold px-2 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="font-bold px-2 py-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>Trip</CardHeader>
          <CardBody>
            <InfoRow
              label="Pickup"
              icon={MapPin}
              value={
                <span>
                  {booking.pickup?.name || booking.pickup?.address || '—'}
                  {booking.pickup?.zone?.name && (
                    <span className="block text-xs text-gray-400">
                      {booking.pickup.zone.name}
                    </span>
                  )}
                </span>
              }
            />
            <InfoRow
              label="Dropoff"
              icon={MapPin}
              value={
                <span>
                  {booking.dropoff?.name || booking.dropoff?.address || '—'}
                  {booking.dropoff?.zone?.name && (
                    <span className="block text-xs text-gray-400">
                      {booking.dropoff.zone.name}
                    </span>
                  )}
                </span>
              }
            />
            <InfoRow
              label="Date & Time"
              value={`${fmtDate(booking.pickupDate)}${booking.pickupTime ? ` • ${booking.pickupTime}` : ''}`}
            />
            {booking.tripType === 'hourly' && (
              <InfoRow label="Hours Booked" value={booking.hoursBooked} />
            )}
            <InfoRow
              label="Vehicle"
              icon={Car}
              value={`${booking.vehicle?.brand || ''} ${booking.vehicle?.model || ''}`.trim() || '—'}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>Customer</CardHeader>
          <CardBody>
            <InfoRow
              label="Name"
              icon={User}
              value={`${bd.firstName || ''} ${bd.lastName || ''}`.trim() || '—'}
            />
            <InfoRow label="Email" icon={Mail} value={bd.email} />
            <InfoRow label="Phone" icon={Phone} value={phone} />
            {bd.flightNumber && (
              <InfoRow label="Flight" icon={Plane} value={bd.flightNumber} />
            )}
            {booking.handledBy?.name && (
              <InfoRow
                label="Handled By"
                value={`${booking.handledBy.name}${booking.handledBy.email ? ` (${booking.handledBy.email})` : ''}`}
              />
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>Payment</CardHeader>
          <CardBody>
            <InfoRow label="Method" icon={CreditCard} value={booking.payment?.method} />
            <InfoRow label="Status" value={(booking.payment?.status || '—').toUpperCase()} />
            <InfoRow
              label="Amount Paid"
              value={
                booking.payment
                  ? `${(booking.payment.currency || '').toUpperCase()} ${Number(booking.payment.amount ?? 0).toLocaleString()}`
                  : '—'
              }
            />
            <InfoRow label="Transaction ID" value={transactionId} />
            <InfoRow
              label="Base Fare"
              value={`${(booking.orderSummary?.currency || '').toUpperCase()} ${Number(booking.orderSummary?.baseFare ?? 0).toLocaleString()}`}
            />
            <InfoRow
              label="Total"
              value={
                <span className="font-bold text-gray-900">
                  {(booking.orderSummary?.currency || '').toUpperCase()}{' '}
                  {Number(booking.orderSummary?.total ?? 0).toLocaleString()}
                </span>
              }
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
