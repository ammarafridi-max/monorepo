'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Ticket, ChevronLeft, ChevronRight,
  Loader2, ArrowUpRight, Trash2, Search,
} from 'lucide-react';
import { useDummyTickets } from '@travel-suite/frontend-shared/hooks/dummy-tickets/useDummyTickets';
import { useDeleteDummyTicket } from '@travel-suite/frontend-shared/hooks/dummy-tickets/useDeleteDummyTicket';
import { extractIataCode } from '@travel-suite/frontend-shared/utils/extractIataCode';
import { convertToDubaiDate } from '@travel-suite/frontend-shared/utils/dates';

/* --- Config ------------------------------------------------------------------ */

const PAYMENT_TABS = [
  { value: '',       label: 'All'      },
  { value: 'PAID',   label: 'Paid'     },
  { value: 'UNPAID', label: 'Unpaid'   },
];

const ORDER_TABS = [
  { value: '',          label: 'All'       },
  { value: 'PENDING',   label: 'Pending'   },
  { value: 'PROGRESS',  label: 'Progress'  },
  { value: 'DELIVERED', label: 'Delivered' },
];

const TIME_OPTIONS = [
  { value: 'all_time', label: 'All time'      },
  { value: '6_hours',  label: 'Last 6 hours'  },
  { value: '12_hours', label: 'Last 12 hours' },
  { value: '24_hours', label: 'Last 24 hours' },
  { value: '7_days',   label: 'Last 7 days'   },
  { value: '14_days',  label: 'Last 14 days'  },
  { value: '30_days',  label: 'Last 30 days'  },
  { value: '90_days',  label: 'Last 90 days'  },
];

/* --- Badges ------------------------------------------------------------------ */

const PAYMENT_CFG = {
  PAID:     { dot: 'bg-green-500', cls: 'bg-green-50  text-green-700  border-green-200'  },
  UNPAID:   { dot: 'bg-amber-400', cls: 'bg-amber-50  text-amber-700  border-amber-200'  },
  REFUNDED: { dot: 'bg-gray-400',  cls: 'bg-gray-100  text-gray-600   border-gray-200'   },
};

const ORDER_CFG = {
  PENDING:   { dot: 'bg-amber-400', cls: 'bg-amber-50  text-amber-700  border-amber-200'  },
  PROGRESS:  { dot: 'bg-blue-400',  cls: 'bg-blue-50   text-blue-700   border-blue-200'   },
  DELIVERED: { dot: 'bg-green-500', cls: 'bg-green-50  text-green-700  border-green-200'  },
};

function PaymentBadge({ status }) {
  const cfg = PAYMENT_CFG[status] ?? { dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status ?? '—'}
    </span>
  );
}

function OrderBadge({ status }) {
  const cfg = ORDER_CFG[status] ?? { dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status ?? '—'}
    </span>
  );
}

/* --- Filter pill ------------------------------------------------------------- */

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
        active
          ? 'bg-primary-700 text-white border-primary-700'
          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

/* --- Main content ------------------------------------------------------------ */

function DummyTicketsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const { dummyTickets = [], pagination, isLoadingDummyTickets } = useDummyTickets();
  const { deleteDummyTicket, isDeleting }                        = useDeleteDummyTicket();

  const page          = Number(searchParams.get('page')          || 1);
  const paymentFilter = searchParams.get('paymentStatus')        || '';
  const orderFilter   = searchParams.get('orderStatus')          || '';
  const search        = searchParams.get('search')               ?? '';
  const createdAt     = searchParams.get('createdAt')            ?? 'all_time';
  const totalPages    = pagination?.totalPages                   ?? 1;
  const total         = pagination?.total                        ?? 0;

  function setParam(key, value) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    router.push(`?${p.toString()}`);
  }

  function goToPage(p) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Dummy Tickets</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isLoadingDummyTickets ? 'Loading…' : `${total} ticket${total !== 1 ? 's' : ''} total`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setParam('search', e.target.value)}
            placeholder="Search by name, email, session..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Payment</span>
          {PAYMENT_TABS.map(({ value, label }) => (
            <FilterPill key={value} label={label} active={paymentFilter === value} onClick={() => setParam('paymentStatus', value)} />
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Order</span>
          {ORDER_TABS.map(({ value, label }) => (
            <FilterPill key={value} label={label} active={orderFilter === value} onClick={() => setParam('orderStatus', value)} />
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Created</span>
          <select
            value={createdAt}
            onChange={(e) => setParam('createdAt', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            {TIME_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoadingDummyTickets ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : dummyTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Ticket size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">No tickets found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting the filters above.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['Passenger', 'Email', 'Route', 'Type', 'Delivery', 'Handled By', 'Payment', 'Order', 'Date', ''].map((h, i) => (
                      <th key={i} className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dummyTickets.map((item) => (
                    <tr key={item?.sessionId || item?._id} className="hover:bg-gray-50/60 transition-colors group">

                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 capitalize leading-snug">
                          {String(item?.leadPassenger ?? '—').toLowerCase()}
                        </p>
                        {item?.passengers?.length > 1 && (
                          <p className="text-xs text-gray-400 mt-0.5">+{item.passengers.length - 1} more</p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate">
                        {item?.email ?? '—'}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700 font-semibold whitespace-nowrap">
                        {extractIataCode(item?.from)} → {extractIataCode(item?.to)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap capitalize">
                        {item?.type ?? '—'}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {item?.ticketDelivery?.immediate
                          ? 'Immediate'
                          : item?.ticketDelivery?.deliveryDate
                            ? convertToDubaiDate(item.ticketDelivery.deliveryDate)
                            : '—'}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {item?.handledBy?.name ? item.handledBy.name.split(' ')[0] : '—'}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <PaymentBadge status={item?.paymentStatus} />
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <OrderBadge status={item?.orderStatus} />
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                        {convertToDubaiDate(item?.updatedAt)}
                      </td>

                      <td className="px-4 py-3 w-20">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/dummy-tickets/${item?.sessionId}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition"
                            title="View details"
                          >
                            <ArrowUpRight size={14} />
                          </Link>
                          <button
                            onClick={() => deleteDummyTicket(item?.sessionId)}
                            disabled={isDeleting || item?.paymentStatus === 'PAID'}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title={item?.paymentStatus === 'PAID' ? 'Cannot delete paid tickets' : 'Delete'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-400">Page {page} of {totalPages} · {total} total</p>
                <div className="flex items-center gap-2">
                  <button disabled={page === 1} onClick={() => goToPage(page - 1)} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    <ChevronLeft size={14} />
                  </button>
                  <button disabled={page === totalPages} onClick={() => goToPage(page + 1)} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* --- Page -------------------------------------------------------------------- */

export default function DummyTicketsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    }>
      <DummyTicketsContent />
    </Suspense>
  );
}
