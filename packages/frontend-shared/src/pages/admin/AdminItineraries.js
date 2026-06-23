'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plane, ChevronLeft, ChevronRight, Loader2, ArrowUpRight, Download, Search, Trash2,
} from 'lucide-react';
import { useItineraryOrders } from '../../hooks/itineraries/useItineraryOrders';
import { useDeleteItineraryOrder } from '../../hooks/itineraries/useDeleteItineraryOrder';
import { itineraryDocumentUrl } from '../../services/apiItineraries';
import { convertToDubaiDate } from '../../utils/dates';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const PAYMENT_OPTIONS = [
  { value: '',       label: 'All payments' },
  { value: 'PAID',   label: 'Paid'         },
  { value: 'UNPAID', label: 'Unpaid'       },
];

const STATUS_OPTIONS = [
  { value: '',           label: 'All statuses' },
  { value: 'GENERATED',  label: 'Generated'    },
  { value: 'GENERATING', label: 'Generating'   },
  { value: 'FAILED',     label: 'Failed'       },
  { value: 'DRAFT',      label: 'Draft'        },
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

const PAYMENT_CFG = {
  PAID:     { dot: 'bg-green-500', cls: 'bg-green-50 text-green-700 border-green-200' },
  UNPAID:   { dot: 'bg-amber-400', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  REFUNDED: { dot: 'bg-gray-400',  cls: 'bg-gray-100 text-gray-600  border-gray-200'  },
};

const STATUS_CFG = {
  GENERATED:  { dot: 'bg-green-500', cls: 'bg-green-50 text-green-700 border-green-200' },
  GENERATING: { dot: 'bg-blue-400',  cls: 'bg-blue-50  text-blue-700  border-blue-200'  },
  DRAFT:      { dot: 'bg-gray-400',  cls: 'bg-gray-100 text-gray-600  border-gray-200'  },
  FAILED:     { dot: 'bg-red-400',   cls: 'bg-red-50   text-red-700   border-red-200'   },
};

function Badge({ status, cfgMap }) {
  const cfg = cfgMap[status] ?? { dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status ?? '—'}
    </span>
  );
}

function fmtShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function fmtAmount(order) {
  const paid = order?.paymentStatus === 'PAID' && order?.amountPaid?.amount;
  const currency = (paid ? order.amountPaid.currency : order?.currency) ?? 'AED';
  const amount = paid ? order.amountPaid.amount : order?.price;
  if (amount == null) return '—';
  return `${currency} ${Number(amount).toLocaleString('en-US')}`;
}

function ItinerariesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { adminUser } = useAdminAuth();
  const isAdmin = adminUser?.role === 'admin';

  const { orders = [], pagination, isLoadingOrders, isErrorOrders } = useItineraryOrders();
  const { deleteItineraryOrder, isDeleting } = useDeleteItineraryOrder({ redirect: false });

  const page          = Number(searchParams.get('page') || 1);
  const search        = searchParams.get('search')        ?? '';
  const paymentFilter = searchParams.get('paymentStatus') ?? '';
  const statusFilter  = searchParams.get('status')        ?? '';
  const createdAt     = searchParams.get('createdAt')     ?? 'all_time';
  const totalPages    = pagination?.totalPages            ?? 1;
  const total         = pagination?.total                 ?? 0;

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

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Travel Itineraries</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isLoadingOrders ? 'Loading…' : `${total} itinerar${total !== 1 ? 'ies' : 'y'} total`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setParam('search', e.target.value)}
            placeholder="Search by name, email, country, session..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
          />
        </div>

        <select
          value={paymentFilter}
          onChange={(e) => setParam('paymentStatus', e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          {PAYMENT_OPTIONS.map(({ value, label }) => (
            <option key={value || 'all'} value={value}>{label}</option>
          ))}
        </select>

        <div className="w-px h-5 bg-gray-200 hidden sm:block" />

        <select
          value={statusFilter}
          onChange={(e) => setParam('status', e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value || 'all'} value={value}>{label}</option>
          ))}
        </select>

        <div className="w-px h-5 bg-gray-200 hidden sm:block" />

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

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoadingOrders ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : isErrorOrders ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <p className="text-sm font-bold text-red-600">Couldn&apos;t load itineraries</p>
            <p className="text-xs text-gray-400 max-w-xs">
              The request failed — likely a rate limit or backend error. Refresh in a moment.
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Plane size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">No itineraries found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting the filters above.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['Traveller', 'Email', 'Applying To', 'Route', 'Travel Dates', 'Status', 'Payment', 'Amount', 'Created', ''].map((hd, i) => (
                      <th key={i} className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                        {hd}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((item) => {
                    const input = item?.input ?? {};
                    const t = input.traveller ?? {};
                    const route = input.arrival?.city === input.departure?.city
                      ? `${input.arrival?.city ?? '—'}`
                      : `${input.arrival?.city ?? '—'} → ${input.departure?.city ?? '—'}`;
                    const isPaid = item?.paymentStatus === 'PAID';
                    const canDownload = isPaid && item?.status === 'GENERATED';
                    return (
                      <tr key={item?.sessionId || item?._id} className="hover:bg-gray-50/60 transition-colors group">

                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 capitalize leading-snug">
                            {String(t.fullName || t.firstName || '—').toLowerCase()}
                          </p>
                          {input.travellers > 1 && (
                            <p className="text-xs text-gray-400 mt-0.5">{input.travellers} travellers</p>
                          )}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate">
                          {t.email ?? '—'}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-700 font-semibold whitespace-nowrap">
                          {input.visaCountry ?? '—'}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {route}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {input.startDate ? `${fmtShort(input.startDate)} – ${fmtShort(input.endDate)}` : '—'}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge status={item?.status} cfgMap={STATUS_CFG} />
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge status={item?.paymentStatus} cfgMap={PAYMENT_CFG} />
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-700 font-semibold whitespace-nowrap">
                          {fmtAmount(item)}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                          {convertToDubaiDate(item?.createdAt)}
                        </td>

                        <td className="px-4 py-3 w-24">
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/admin/itineraries/${item?.sessionId}`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition"
                              title="View details"
                            >
                              <ArrowUpRight size={14} />
                            </Link>
                            {canDownload && (
                              <a
                                href={itineraryDocumentUrl(item?.sessionId)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition"
                                title="Download PDF"
                              >
                                <Download size={14} />
                              </a>
                            )}
                            <button
                              onClick={() => deleteItineraryOrder(item?.sessionId)}
                              disabled={!isAdmin || isDeleting || isPaid}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                              title={
                                !isAdmin
                                  ? 'Only admins can delete itineraries'
                                  : isPaid
                                    ? 'Paid itineraries cannot be deleted'
                                    : 'Delete'
                              }
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
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

export default function AdminItineraries() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    }>
      <ItinerariesContent />
    </Suspense>
  );
}
