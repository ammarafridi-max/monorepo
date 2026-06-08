'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Car,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
} from 'lucide-react';
import { useGetBookings } from '../../hooks/limo-bookings/useGetBookings';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PAYMENT_CFG = {
  paid: { label: 'PAID', cls: 'bg-green-50 text-green-700 border-green-200' },
  unpaid: { label: 'UNPAID', cls: 'bg-red-50 text-red-600 border-red-200' },
  pending: { label: 'PENDING', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  refunded: { label: 'REFUNDED', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
};

function PaymentPill({ status }) {
  const key = (status || '').toLowerCase();
  const cfg = PAYMENT_CFG[key] ?? {
    label: (status || '—').toUpperCase(),
    cls: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

export default function AdminLimoBookingsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { bookings = [], isLoadingBookings } = useGetBookings({ page, limit });

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Bookings</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} on this page
          </p>
        </div>
        <Link
          href="/admin/bookings/calendar"
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <CalendarDays size={14} /> Calendar
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoadingBookings ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Car size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">No bookings yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Bookings will appear here once customers make them.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Booking', 'Trip', 'Amount'].map((h, i) => (
                    <th
                      key={i}
                      className={`text-[11px] font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap ${
                        h === 'Amount' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => {
                  const id = b._id || b.id;
                  return (
                    <tr
                      key={id}
                      className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                      onClick={() => {
                        window.location.href = `/admin/bookings/${id}`;
                      }}
                    >
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={`/admin/bookings/${id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex flex-col gap-0.5"
                        >
                          <span className="font-mono font-bold text-gray-900 text-sm">
                            {b.bookingRef || '—'}
                          </span>
                          <span className="font-medium text-gray-700">
                            {b.bookingDetails?.firstName} {b.bookingDetails?.lastName}
                          </span>
                          <span className="text-xs text-gray-400">
                            {fmtDateTime(b.createdAt)}
                          </span>
                        </Link>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                            <MapPin size={13} className="text-gray-400 shrink-0" />
                            <span>
                              {b.pickup?.zone?.name || b.pickup?.name || b.pickup?.address || '—'}
                              {b.dropoff?.zone?.name || b.dropoff?.name
                                ? ` → ${b.dropoff?.zone?.name || b.dropoff?.name || b.dropoff?.address}`
                                : ''}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {fmtDate(b.pickupDate)}
                            {b.pickupTime ? ` • ${b.pickupTime}` : ''}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Car size={12} className="shrink-0" />
                            {b.vehicle?.brand} {b.vehicle?.model}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-semibold text-gray-900 whitespace-nowrap">
                            {(b.orderSummary?.currency || '').toUpperCase()}{' '}
                            {Number(b.orderSummary?.total ?? 0).toLocaleString()}
                          </span>
                          <PaymentPill status={b.payment?.status} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Page {page}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoadingBookings}
            className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={bookings.length < limit || isLoadingBookings}
            className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
