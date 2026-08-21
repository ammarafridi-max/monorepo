'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Ticket, ChevronLeft, ChevronRight,
  Loader2, ArrowUpRight, Trash2, CalendarDays,
  SlidersHorizontal, X,
} from 'lucide-react';
import { FaPaypal } from 'react-icons/fa';
import { useDummyTickets } from '../../hooks/dummy-tickets/useDummyTickets';
import { useDeleteDummyTicket } from '../../hooks/dummy-tickets/useDeleteDummyTicket';
import { extractIataCode } from '../../utils/extractIataCode';
import { convertToDubaiDate } from '../../utils/dates';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import AdminSearchInput from '../../components/admin/AdminSearchInput';

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


function DummyTicketsContent() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const { adminUser } = useAdminAuth();

  const isAgent = adminUser?.role === 'agent';

  const { dummyTickets = [], pagination, isLoadingDummyTickets, isErrorDummyTickets } = useDummyTickets();
  const { deleteDummyTicket, isDeleting }                        = useDeleteDummyTicket();

  const page           = Number(searchParams.get('page')          || 1);

  const urlPayment      = searchParams.get('paymentStatus')        || 'PAID';
  const urlOrder        = searchParams.get('orderStatus')          || '';
  const urlSearch       = searchParams.get('search')               ?? '';
  const urlDeliveryDate = searchParams.get('deliveryDate')         ?? '';
  const urlCreatedAt    = searchParams.get('createdAt')            ?? 'all_time';

  const [localSearch,       setLocalSearch]       = useState(urlSearch);
  const [localPayment,      setLocalPayment]      = useState(urlPayment);
  const [localOrder,        setLocalOrder]        = useState(urlOrder);
  const [localCreatedAt,    setLocalCreatedAt]    = useState(urlCreatedAt);
  const [localDeliveryDate, setLocalDeliveryDate] = useState(urlDeliveryDate);

  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => { setLocalSearch(urlSearch);             }, [urlSearch]);
  useEffect(() => { setLocalPayment(urlPayment);           }, [urlPayment]);
  useEffect(() => { setLocalOrder(urlOrder);               }, [urlOrder]);
  useEffect(() => { setLocalCreatedAt(urlCreatedAt);       }, [urlCreatedAt]);
  useEffect(() => { setLocalDeliveryDate(urlDeliveryDate); }, [urlDeliveryDate]);

  // Agents are locked to the last 4 hours unless searching; the backend enforces the same rule.
  const hasSearch       = localSearch.trim().length > 0;
  const agentTimeLocked = isAgent && !hasSearch;
  const createdAt       = agentTimeLocked ? '4_hours' : localCreatedAt;
  const totalPages      = pagination?.totalPages                   ?? 1;
  const total           = pagination?.total                        ?? 0;

  const didDefaultRef = useRef(false);
  useEffect(() => {
    if (didDefaultRef.current) return;
    didDefaultRef.current = true;
    if (searchParams.get('paymentStatus')) return;
    const p = new URLSearchParams(searchParams.toString());
    p.set('paymentStatus', 'PAID');
    router.replace(`${pathname}?${p.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pushParams(nextParams) {
    const p = new URLSearchParams(nextParams);
    p.delete('page');
    router.push(`${pathname}?${p.toString()}`);
  }

  function setParam(key, value) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    pushParams(p);
  }

  useEffect(() => {
    if (localSearch === urlSearch) return;
    const t = setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString());
      if (localSearch) p.set('search', localSearch); else p.delete('search');
      pushParams(p);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch, urlSearch]);

  function goToPage(p) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const activeFilterCount = [
    localPayment !== 'PAID',
    localOrder !== '',
    !agentTimeLocked && localCreatedAt !== 'all_time',
    localDeliveryDate !== '',
  ].filter(Boolean).length;

  const selectCls = 'px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white';

  const paymentControl = (className = '') => (
    <select
      value={localPayment}
      onChange={(e) => { setLocalPayment(e.target.value); setParam('paymentStatus', e.target.value); }}
      className={`${selectCls} ${className}`}
    >
      <option value="all">All payments</option>
      {PAYMENT_TABS.filter(({ value }) => value !== '').map(({ value, label }) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  );

  const orderControl = (className = '') => (
    <select
      value={localOrder}
      onChange={(e) => { setLocalOrder(e.target.value); setParam('orderStatus', e.target.value); }}
      className={`${selectCls} ${className}`}
    >
      <option value="">All orders</option>
      {ORDER_TABS.filter(({ value }) => value !== '').map(({ value, label }) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  );

  const timeControl = (className = '') => (
    agentTimeLocked ? (
      <span
        className={`px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-500 ${className}`}
        title="Agents see the last 4 hours by default. Type in the search box to look up older tickets."
      >
        Last 4 hours
      </span>
    ) : (
      <select
        value={createdAt}
        onChange={(e) => { setLocalCreatedAt(e.target.value); setParam('createdAt', e.target.value); }}
        className={`${selectCls} ${className}`}
      >
        <option value="all_time">All time</option>
        {TIME_OPTIONS.filter(({ value }) => value !== 'all_time').map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    )
  );

  const deliveryControl = (className = '') => (
    <div className={`relative ${className}`}>
      <input
        type="date"
        value={localDeliveryDate}
        onChange={(e) => { setLocalDeliveryDate(e.target.value); setParam('deliveryDate', e.target.value); }}
        className={`${selectCls} w-full`}
      />
      {localDeliveryDate && (
        <button
          onClick={() => { setLocalDeliveryDate(''); setParam('deliveryDate', ''); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          title="Clear delivery date filter"
        >
          ×
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Dummy Tickets</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {isLoadingDummyTickets ? 'Loading…' : `${total} ticket${total !== 1 ? 's' : ''} total`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Search + (phones only) filter button, in one row */}
        <div className="flex items-center gap-3 w-full sm:w-auto sm:max-w-sm">
          <AdminSearchInput
            value={localSearch}
            onChange={setLocalSearch}
            placeholder="Search by name, email, session..."
            className="flex-1"
          />
          <button
            onClick={() => setFiltersOpen(true)}
            title="Filters"
            aria-label="Filters"
            className="sm:hidden relative shrink-0 flex items-center text-gray-800 hover:text-black transition-colors"
          >
            <SlidersHorizontal size={18} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 flex items-center justify-center text-[9px] font-bold text-white bg-primary-600 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Inline filter bar — sm and up only */}
        <div className="hidden sm:flex flex-wrap items-center gap-4">
          {paymentControl()}
          <div className="w-px h-5 bg-gray-200" />
          {orderControl()}
          <div className="w-px h-5 bg-gray-200" />
          {timeControl()}
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-2">
            <CalendarDays size={13} className="text-gray-400 shrink-0" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Delivery</span>
            {deliveryControl()}
          </div>
        </div>
      </div>

      {/* Filter modal — phones only. Bottom sheet with the same controls. */}
      {filtersOpen && (
        <div
          className="sm:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="bg-white w-full rounded-t-2xl p-5 space-y-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Filters</h3>
              <button
                onClick={() => setFiltersOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Payment</label>
              {paymentControl('w-full')}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Order</label>
              {orderControl('w-full')}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Time</label>
              {timeControl('w-full')}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Delivery date</label>
              {deliveryControl('w-full')}
            </div>

            <button
              onClick={() => setFiltersOpen(false)}
              className="w-full py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoadingDummyTickets ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : isErrorDummyTickets ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <p className="text-sm font-bold text-red-600">Couldn't load tickets</p>
            <p className="text-xs text-gray-400 max-w-xs">
              The request failed — likely a rate limit or backend error. Refresh in a moment.
            </p>
          </div>
        ) : dummyTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Ticket size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">No tickets found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting the filters.</p>
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
                        <Link
                          href={`/admin/dummy-tickets/${item?.sessionId}`}
                          className="block font-semibold text-gray-900 capitalize leading-snug hover:text-primary-700 hover:underline transition-colors"
                        >
                          {String(item?.leadPassenger ?? '—').toLowerCase()}
                        </Link>
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
                        <div className="flex flex-col gap-1">
                          <PaymentBadge status={item?.paymentStatus} />
                          {item?.paymentStatus === 'PAID' &&
                            item?.paymentMethod === 'paypal' && (
                              <FaPaypal size={12} className="text-[#009cde] ml-0.5" title="PayPal" />
                            )}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <OrderBadge status={item?.orderStatus} />
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                        {convertToDubaiDate(item?.paidAt || item?.createdAt)}
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
                            disabled={isAgent || isDeleting || item?.paymentStatus === 'PAID'}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title={
                              isAgent
                                ? 'Only admins can delete tickets'
                                : item?.paymentStatus === 'PAID'
                                  ? 'Cannot delete paid tickets'
                                  : 'Delete'
                            }
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

export default function AdminDummyTicketsPage() {
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
