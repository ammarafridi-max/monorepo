'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, AlertCircle, Trash2, BedDouble, Mail, Phone,
  MapPin, CreditCard, Calendar, Users, Hash, RotateCcw, XCircle, ShieldCheck,
} from 'lucide-react';
import { useHotelBooking } from '../../hooks/hotel-bookings/useHotelBooking';
import {
  useCancelHotelBooking,
  useRetryHotelBooking,
  useUpdateHotelBookingStatus,
  useDeleteHotelBooking,
} from '../../hooks/hotel-bookings/useHotelBookingActions';
import AttributionCard from '../../components/admin/AttributionCard';

const ORDER_CFG = {
  PENDING:        { dot: 'bg-amber-400', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  BOOKED:         { dot: 'bg-green-500', cls: 'bg-green-50 text-green-700 border-green-200' },
  DELIVERED:      { dot: 'bg-blue-400',  cls: 'bg-blue-50  text-blue-700  border-blue-200'  },
  BOOKING_FAILED: { dot: 'bg-red-500',   cls: 'bg-red-50   text-red-700   border-red-200'   },
  REFUNDED:       { dot: 'bg-gray-400',  cls: 'bg-gray-100 text-gray-600  border-gray-200'  },
};

const CANCELLATION_CFG = {
  NOT_BOOKED: 'bg-gray-100  text-gray-500  border-gray-200',
  SCHEDULED:  'bg-indigo-50 text-indigo-700 border-indigo-200',
  CANCELLED:  'bg-green-50  text-green-700  border-green-200',
  FAILED:     'bg-red-50    text-red-700    border-red-200',
};

const ORDER_LABELS = {
  PENDING: 'Pending',
  BOOKED: 'Booked',
  DELIVERED: 'Delivered',
  BOOKING_FAILED: 'Booking failed',
  REFUNDED: 'Refunded',
};

function OrderBadge({ status }) {
  const cfg = ORDER_CFG[status] ?? { dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {ORDER_LABELS[status] ?? status ?? '—'}
    </span>
  );
}

function CancellationBadge({ status }) {
  const cls = CANCELLATION_CFG[status] ?? 'bg-gray-100 text-gray-500 border-gray-200';
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      {status ? status.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase()) : '—'}
    </span>
  );
}

function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }) + ' UTC';
}

function Card({ icon: Icon, title, children, action }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-gray-400" />
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Row({ label, value, mono = false, accent = '' }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <p className="text-xs font-semibold text-gray-400 shrink-0">{label}</p>
      <p className={`text-sm text-right ${mono ? 'font-mono text-xs' : ''} ${accent || 'text-gray-800'}`}>
        {value ?? '—'}
      </p>
    </div>
  );
}

function DangerZone({ sessionId }) {
  const [confirm, setConfirm] = useState(false);
  const { deleteReservation, isDeleting } = useDeleteHotelBooking();

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition"
      >
        <Trash2 size={13} /> Delete Reservation
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
      <p className="text-xs font-semibold text-red-700">
        This permanently deletes the reservation record. It does not cancel the supplier booking, so cancel that first.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => deleteReservation(sessionId)}
          disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-60"
        >
          {isDeleting && <Loader2 size={11} className="animate-spin" />}
          Confirm Delete
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="flex-1 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminHotelBookingDetailPage() {
  const { sessionId } = useParams();

  const { reservation, isLoadingReservation, isErrorReservation } = useHotelBooking(sessionId);
  const { cancelReservation, isCancelling } = useCancelHotelBooking();
  const { retryBooking, isRetrying } = useRetryHotelBooking();
  const { updateStatus, isUpdatingStatus } = useUpdateHotelBookingStatus();

  if (isLoadingReservation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-medium">Loading reservation…</p>
        </div>
      </div>
    );
  }

  if (isErrorReservation || !reservation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">Reservation not found</p>
            <p className="text-xs text-gray-400 mt-1">This reservation may have been deleted.</p>
          </div>
          <Link href="/admin/hotel-bookings" className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline">
            <ArrowLeft size={13} /> Back to reservations
          </Link>
        </div>
      </div>
    );
  }

  const r = reservation;
  const deadline = r.freeCancellationUntil ? new Date(r.freeCancellationUntil) : null;
  const windowOpen = Boolean(deadline && deadline.getTime() > Date.now());
  const canCancel = Boolean(r.supplier?.bookingId) && r.cancellationStatus !== 'CANCELLED';
  const guestCount = r.guests?.length ?? 0;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/admin/hotel-bookings"
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-primary-700 transition mb-2"
          >
            <ArrowLeft size={13} /> Back to reservations
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-extrabold text-gray-900">{r.leadGuest ?? 'Reservation'}</h2>
            <OrderBadge status={r.orderStatus} />
            <CancellationBadge status={r.cancellationStatus} />
          </div>
          <p className="text-[11px] text-gray-400 font-mono mt-0.5">{r.sessionId}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={r.orderStatus ?? ''}
            disabled={isUpdatingStatus}
            onChange={(e) => updateStatus({ sessionId: r.sessionId, orderStatus: e.target.value })}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-primary-400 disabled:opacity-60"
          >
            {Object.entries(ORDER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {r.orderStatus === 'BOOKING_FAILED' && (
            <button
              onClick={() => retryBooking(r.sessionId)}
              disabled={isRetrying}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 disabled:opacity-50 transition"
            >
              {isRetrying ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
              Retry booking
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => cancelReservation({ sessionId: r.sessionId })}
              disabled={isCancelling || !windowOpen}
              title={windowOpen ? 'Cancel the supplier booking' : 'Free-cancellation window has closed'}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {isCancelling ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
              Cancel booking
            </button>
          )}
        </div>
      </div>

      {r.orderStatus === 'BOOKING_FAILED' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-700">The customer paid but the supplier booking failed.</p>
          <p className="text-xs text-red-600 mt-1">{r.supplier?.lastError ?? 'No error recorded.'}</p>
        </div>
      )}

      {r.cancellationStatus === 'SCHEDULED' && deadline && (
        <div className={`rounded-2xl border p-4 ${windowOpen ? 'border-indigo-200 bg-indigo-50' : 'border-red-200 bg-red-50'}`}>
          <p className={`text-sm font-bold ${windowOpen ? 'text-indigo-700' : 'text-red-700'}`}>
            {windowOpen
              ? `Free cancellation until ${fmtDateTime(deadline)}`
              : `Free-cancellation window closed on ${fmtDateTime(deadline)}`}
          </p>
          <p className={`text-xs mt-1 ${windowOpen ? 'text-indigo-600' : 'text-red-600'}`}>
            {windowOpen
              ? 'The cancellation job cancels this automatically before the deadline.'
              : 'Cancelling now will incur a fee and needs an admin to force it.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card icon={BedDouble} title="Hotel">
            <Row label="Name" value={r.hotel?.name} />
            <Row label="Address" value={r.hotel?.address} />
            <Row label="City" value={r.hotel?.city ?? r.destination?.cityName} />
            <Row label="Country" value={r.hotel?.country ?? r.destination?.countryCode} />
            <Row label="Stars" value={r.hotel?.stars} />
            <Row label="Hotel phone" value={r.hotel?.phone} />
          </Card>

          <Card icon={Calendar} title="Stay">
            <Row label="Check-in" value={fmtDate(r.checkIn)} />
            <Row label="Check-out" value={fmtDate(r.checkOut)} />
            <Row label="Nights" value={r.nights} />
            <Row label="Rooms" value={r.occupancy?.rooms} />
            <Row label="Adults" value={r.occupancy?.adults} />
            <Row label="Children" value={r.occupancy?.children?.length || 0} />
            <Row label="Guest nationality" value={r.guestNationality} />
          </Card>

          <Card icon={Users} title={`Guests (${guestCount})`}>
            {guestCount === 0 ? (
              <p className="text-sm text-gray-400">No guests recorded.</p>
            ) : (
              <div className="space-y-2">
                {r.guests.map((g, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
                    <p className="text-sm text-gray-800">
                      {[g.title, g.firstName, g.lastName].filter(Boolean).join(' ') || '—'}
                    </p>
                    {g.isLead && (
                      <span className="text-[10px] font-bold text-primary-700 bg-primary-50 border border-primary-200 px-2 py-0.5 rounded-full">
                        LEAD
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card icon={ShieldCheck} title="Supplier booking">
            <Row label="Supplier" value={r.supplier?.name} />
            <Row label="Booking ID" value={r.supplier?.bookingId} mono />
            <Row label="Supplier ref" value={r.supplier?.supplierBookingId} mono />
            <Row label="Hotel confirmation" value={r.supplier?.hotelConfirmationCode} mono />
            <Row label="Hotel ID" value={r.supplier?.hotelId} mono />
            <Row
              label="Supplier price"
              value={r.supplier?.price?.amount ? `${r.supplier.price.currency ?? ''} ${r.supplier.price.amount}` : null}
            />
            <Row
              label="Quoted at checkout"
              value={r.supplier?.quotedPrice?.amount ? `${r.supplier.quotedPrice.currency ?? ''} ${r.supplier.quotedPrice.amount}` : null}
            />
            <Row
              label="Room substituted"
              value={r.supplier?.offerReplaced ? 'Yes, original offer expired' : 'No'}
              accent={r.supplier?.offerReplaced ? 'text-amber-600' : ''}
            />
            <Row label="Booked at" value={r.supplier?.bookedAt ? fmtDateTime(r.supplier.bookedAt) : null} />
            <Row label="Last error" value={r.supplier?.lastError} accent="text-red-600" />
          </Card>
        </div>

        <div className="space-y-5">
          <Card icon={Mail} title="Customer">
            <Row label="Email" value={r.email} />
            <Row
              label="Phone"
              value={r.phoneNumber?.digits ? `${r.phoneNumber.code ?? ''}${r.phoneNumber.digits}` : null}
            />
          </Card>

          <Card icon={CreditCard} title="Payment">
            <Row label="Status" value={r.paymentStatus} />
            <Row
              label="Amount paid"
              value={r.amountPaid?.amount ? `${r.amountPaid.currency ?? ''} ${r.amountPaid.amount}` : null}
              accent="text-green-700"
            />
            <Row label="Quoted" value={r.totalAmount ? `${r.currency ?? ''} ${r.totalAmount}` : null} />
            <Row label="Method" value={r.paymentMethod} />
            <Row label="Transaction" value={r.transactionId} mono />
            <Row label="Paid at" value={r.paidAt ? fmtDateTime(r.paidAt) : null} />
          </Card>

          <Card icon={XCircle} title="Cancellation">
            <Row label="Status" value={r.cancellationStatus} />
            <Row label="Free until" value={deadline ? fmtDateTime(deadline) : null} />
            <Row label="Cancelled at" value={r.cancelledAt ? fmtDateTime(r.cancelledAt) : null} />
            <Row
              label="Fee charged"
              value={r.cancellationFee?.amount != null ? `${r.cancellationFee.currency ?? ''} ${r.cancellationFee.amount}` : null}
              accent={r.cancellationFee?.amount ? 'text-red-600' : ''}
            />
            <Row label="Attempts" value={r.cancellationAttempts} />
          </Card>

          {r.attribution && <AttributionCard attribution={r.attribution} />}

          <Card icon={Hash} title="Record">
            <Row label="Session" value={r.sessionId} mono />
            <Row label="Created" value={fmtDateTime(r.createdAt)} />
            <Row label="Affiliate" value={r.affiliateId} mono />
          </Card>

          <DangerZone sessionId={r.sessionId} />
        </div>
      </div>
    </div>
  );
}
