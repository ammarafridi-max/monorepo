'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Car,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
} from 'lucide-react';
import { useGetBookings } from '@travel-suite/frontend-shared/hooks/bookings/useGetBookings';

const STATUSES = ['all', 'pending_payment', 'paid', 'confirmed', 'completed', 'cancelled'];

const STATUS_CFG = {
  pending_payment: { label: 'Pending payment', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  paid:            { label: 'Paid',            cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  confirmed:       { label: 'Confirmed',        cls: 'bg-green-50 text-green-700 border-green-200' },
  completed:       { label: 'Completed',        cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  cancelled:       { label: 'Cancelled',        cls: 'bg-red-50 text-red-600 border-red-200' },
};

function StatusPill({ status }) {
  const cfg = STATUS_CFG[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const LIMIT = 20;

export default function AdminBookingsPage() {
  const [page, setPage]     = useState(1);
  const [filter, setFilter] = useState('all');

  const { bookings, total, isLoadingBookings } = useGetBookings({
    page,
    limit: LIMIT,
    status: filter === 'all' ? undefined : filter,
  });

  function handleFilter(s) {
    setFilter(s);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Bookings</h2>
          <p className="mt-0.5 text-sm text-gray-400">{total} total</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => handleFilter(s)}
            className={[
              'rounded-xl border px-3.5 py-1.5 text-xs font-bold capitalize transition-colors',
              filter === s
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700',
            ].join(' ')}
          >
            {s === 'all' ? 'All' : (STATUS_CFG[s]?.label ?? s)}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {isLoadingBookings ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <Car size={22} className="text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-600">No bookings found</p>
            <p className="text-xs text-gray-400">Try a different status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Ref', 'Customer', 'Trip', 'Date booked', 'Status', 'Amount'].map((h, i) => (
                    <th
                      key={i}
                      className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-400 ${h === 'Amount' ? 'text-right' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => {
                  const id  = b._id || b.id;
                  const ref = `AR-${String(id).slice(-6).toUpperCase()}`;
                  return (
                    <tr
                      key={id}
                      onClick={() => { window.location.href = `/admin/bookings/${id}`; }}
                      className="cursor-pointer transition-colors hover:bg-gray-50/60"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/bookings/${id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-xs font-bold text-gray-700 hover:underline"
                        >
                          {ref}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {b.passenger?.firstName} {b.passenger?.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{b.passenger?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-1.5 text-xs text-gray-700">
                          <MapPin size={11} className="mt-0.5 shrink-0 text-gray-400" />
                          <span className="max-w-[200px]">
                            {b.trip?.pickup?.label}
                            <span className="mx-1 text-gray-400">→</span>
                            {b.trip?.dropoff?.label}
                          </span>
                        </div>
                        {b.trip?.date && (
                          <p className="mt-0.5 pl-5 text-xs text-gray-400">
                            {fmtDate(b.trip.date)}{b.trip?.time ? ` · ${b.trip.time}` : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {fmtDateTime(b.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={b.status} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="font-semibold text-gray-900">
                          {b.vehicle?.price?.currency} {b.vehicle?.price?.amount}
                        </span>
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
        <span className="text-xs text-gray-400">
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoadingBookings}
            className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages || isLoadingBookings}
            className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
