'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, AlertCircle, Trash2, BedDouble, Mail, Phone,
  CreditCard, Calendar, Users, Hash, Send,
} from 'lucide-react';
import { useHotelBooking } from '../../hooks/hotel-bookings/useHotelBooking';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  useUpdateHotelBookingStatus,
  useDeleteHotelBooking,
} from '../../hooks/hotel-bookings/useHotelBookingActions';
import SendHotelReservationModal from '../../components/admin/SendHotelReservationModal';
import AttributionCard from '../../components/admin/AttributionCard';

const ORDER_CFG = {
  PENDING:        { dot: 'bg-amber-400', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  PROGRESS:       { dot: 'bg-green-500', cls: 'bg-green-50 text-green-700 border-green-200' },
  DELIVERED:      { dot: 'bg-blue-400',  cls: 'bg-blue-50  text-blue-700  border-blue-200'  },
  REFUNDED:       { dot: 'bg-gray-400',  cls: 'bg-gray-100 text-gray-600  border-gray-200'  },
};

const ORDER_LABELS = {
  PENDING: 'Pending',
  PROGRESS: 'In progress',
  DELIVERED: 'Delivered',
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
        This permanently deletes the booking record. This cannot be undone.
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

export default function AdminHotelBookingDetailPage({ brand }) {
  const { sessionId } = useParams();

  const { reservation, isLoadingReservation, isErrorReservation } = useHotelBooking(sessionId);
  const { adminUser } = useAdminAuth();
  const [sendOpen, setSendOpen] = useState(false);
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

          <button
            type="button"
            onClick={() => setSendOpen(true)}
            disabled={r.paymentStatus !== 'PAID'}
            title={r.paymentStatus !== 'PAID' ? 'The customer has not paid yet' : 'Email the reservation to the customer'}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Send size={13} />
            Send reservation
          </button>
        </div>
      </div>

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

          <Card icon={MessageSquare} title="Customer requirements">
            {r.message
              ? <p className="text-sm text-gray-800 whitespace-pre-line">{r.message}</p>
              : <p className="text-sm text-gray-400">None given.</p>}
          </Card>

          <Card icon={BedDouble} title="Listed rate">
            <Row
              label="Room listed at"
              value={r.hotel?.listedRate?.amount ? `${r.currency ?? ''} ${r.hotel.listedRate.amount}` : null}
            />
            <Row label="Google rating" value={r.hotel?.rating} />
            <Row label="Google listing" value={r.hotel?.link} mono />
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

          {r.attribution && <AttributionCard attribution={r.attribution} />}

          <Card icon={Hash} title="Record">
            <Row label="Session" value={r.sessionId} mono />
            <Row label="Created" value={fmtDateTime(r.createdAt)} />
            <Row label="Affiliate" value={r.affiliateId} mono />
          </Card>

          <DangerZone sessionId={r.sessionId} />

          <SendHotelReservationModal
            open={sendOpen}
            onClose={() => setSendOpen(false)}
            booking={r}
            agentName={adminUser?.name}
            brand={brand}
          />
        </div>
      </div>
    </div>
  );
}
