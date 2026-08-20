'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
} from 'lucide-react';
import { useGetBookings } from '@travel-suite/frontend-shared/hooks/bookings/useGetBookings';

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

function StatCard({ icon: Icon, label, value, iconCls }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconCls}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-gray-400">{label}</p>
      </div>
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function AdminDashboardPage() {
  const { bookings, total, isLoadingBookings } = useGetBookings({ limit: 10 });

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const paid      = bookings.filter((b) => b.status === 'paid').length;
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const pending   = bookings.filter((b) => b.status === 'pending_payment').length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Dashboard</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-400">
            <CalendarDays size={13} /> {today}
          </p>
        </div>
        <Link
          href="/admin/bookings"
          className="flex shrink-0 items-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-primary-800"
        >
          <Car size={14} /> All bookings
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-1 [&>*]:min-w-[160px] [&>*]:shrink-0 xl:[&>*]:min-w-0 xl:[&>*]:flex-1">
        {isLoadingBookings ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-[160px] animate-pulse rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-3 h-10 w-10 rounded-xl bg-gray-100" />
              <div className="mb-1.5 h-7 w-16 rounded-lg bg-gray-100" />
              <div className="h-3 w-24 rounded bg-gray-100" />
            </div>
          ))
        ) : (
          <>
            <StatCard icon={Car}          iconCls="bg-gray-100 text-gray-500" label="Total (this page)" value={bookings.length} />
            <StatCard icon={DollarSign}   iconCls="bg-blue-50 text-blue-600"  label="Paid"              value={paid} />
            <StatCard icon={CheckCircle2} iconCls="bg-green-50 text-green-600" label="Confirmed"        value={confirmed} />
            <StatCard icon={Clock}        iconCls="bg-amber-50 text-amber-600" label="Pending payment"  value={pending} />
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-sm font-bold text-gray-900">Recent bookings</p>
            {!isLoadingBookings && (
              <p className="mt-0.5 text-xs text-gray-400">{total} total</p>
            )}
          </div>
          <Link
            href="/admin/bookings"
            className="flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline"
          >
            View all <ArrowRight size={11} />
          </Link>
        </div>

        {isLoadingBookings ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <Car size={22} className="text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-600">No bookings yet</p>
            <p className="text-xs text-gray-400">Bookings will appear here once customers complete payment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Ref', 'Customer', 'Trip', 'Status', 'Amount'].map((h, i) => (
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
                        <span className="font-mono text-xs font-bold text-gray-700">{ref}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {b.passenger?.firstName} {b.passenger?.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{b.passenger?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                          <MapPin size={11} className="shrink-0 text-gray-400" />
                          <span className="truncate max-w-[180px]">
                            {b.trip?.pickup?.label} → {b.trip?.dropoff?.label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {fmtDate(b.createdAt)} {fmtTime(b.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={b.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-gray-900 whitespace-nowrap">
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

    </div>
  );
}
