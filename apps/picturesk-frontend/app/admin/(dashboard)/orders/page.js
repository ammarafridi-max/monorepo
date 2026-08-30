'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUpRight,
  SlidersHorizontal,
  AlertTriangle,
  Trash2,
  X,
} from 'lucide-react';
import AdminSearchInput from '@travel-suite/frontend-shared/components/admin/AdminSearchInput';
import { useAdminOrders, useBulkDeleteOrders } from '../../../../hooks/admin/useAdminOrders';
import { usd, dateTime, STATUS_LABEL } from '../../../../lib/adminApi';

const PAGE_SIZE = 25;

// Lifecycle order, not alphabetical: an operator reads this as a pipeline.
const STATUSES = ['AWAITING_PAYMENT', 'PAID', 'TRAINING', 'GENERATING', 'DELIVERED', 'FAILED'];

const STATUS_CFG = {
  AWAITING_PAYMENT: { dot: 'bg-gray-400',  cls: 'bg-gray-100  text-gray-600   border-gray-200'  },
  PAID:             { dot: 'bg-blue-400',  cls: 'bg-blue-50   text-blue-700   border-blue-200'  },
  TRAINING:         { dot: 'bg-indigo-400', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  GENERATING:       { dot: 'bg-purple-400', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  DELIVERED:        { dot: 'bg-green-500', cls: 'bg-green-50  text-green-700  border-green-200' },
  FAILED:           { dot: 'bg-red-500',   cls: 'bg-red-50    text-red-700    border-red-200'   },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? { dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function StuckBadge({ minutes }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
      <AlertTriangle size={11} />
      {minutes}m
    </span>
  );
}

function OrdersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlStatus = searchParams.get('status') || '';
  const urlSearch = searchParams.get('search') ?? '';
  const urlStuck = searchParams.get('stuck') === '1';
  const page = Number(searchParams.get('page') || 1);

  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const { bulkDelete, isBulkDeleting } = useBulkDeleteOrders();

  useEffect(() => setLocalSearch(urlSearch), [urlSearch]);

  // Selection is per view. Changing filters or page changes which rows exist, and
  // silently keeping ids you can no longer see is how people delete the wrong thing.
  useEffect(() => {
    setSelected(new Set());
  }, [urlStatus, urlSearch, urlStuck, page]);

  const { orders, stuckCount, stuckAfterMinutes, isLoadingOrders } = useAdminOrders({
    status: urlStatus || undefined,
  });

  function pushParams(p) {
    p.delete('page');
    router.push(`${pathname}?${p.toString()}`);
  }

  function setParam(key, value) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    pushParams(p);
  }

  useEffect(() => {
    if (localSearch === urlSearch) return;
    const t = setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString());
      if (localSearch) p.set('search', localSearch);
      else p.delete('search');
      pushParams(p);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch, urlSearch]);

  // The API returns the newest 200 and has no text search, so email matching and
  // paging happen here. Fine at this volume; move both server-side if it grows.
  const needle = urlSearch.trim().toLowerCase();
  const filtered = orders.filter((o) => {
    if (urlStuck && !o.stuck) return false;
    if (!needle) return true;
    return (
      (o.customerEmail || '').toLowerCase().includes(needle) ||
      o.orderId.toLowerCase().includes(needle)
    );
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const selectedRows = rows.filter((o) => selected.has(o.orderId));
  const allOnPageSelected = rows.length > 0 && selectedRows.length === rows.length;
  const someOnPageSelected = selectedRows.length > 0 && !allOnPageSelected;

  // Deleting a paid order that was never refunded destroys the only record of
  // money we took, so the confirmation calls it out by name.
  const paidUnrefunded = selectedRows.filter((o) => o.amountPaidCents && !o.refundedAt).length;

  function toggleOne(orderId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  function toggleAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) rows.forEach((o) => next.delete(o.orderId));
      else rows.forEach((o) => next.add(o.orderId));
      return next;
    });
  }

  function runBulkDelete() {
    const ids = selectedRows.map((o) => o.orderId);
    setConfirmingDelete(false);
    bulkDelete(ids, { onSettled: () => setSelected(new Set()) });
  }

  function goToPage(p) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const activeFilterCount = [urlStatus !== '', urlStuck].filter(Boolean).length;

  const selectCls =
    'px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white';

  const statusControl = (className = '') => (
    <select
      value={urlStatus}
      onChange={(e) => setParam('status', e.target.value)}
      className={`${selectCls} ${className}`}
    >
      <option value="">All statuses</option>
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s] ?? s}
        </option>
      ))}
    </select>
  );

  function summaryCard(label, value, sub, accent = 'text-gray-900') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4">
        <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className={`text-lg sm:text-2xl font-extrabold ${accent}`}>{value}</p>
        {sub && <p className="hidden sm:block text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    );
  }

  const deliveredRows = filtered.filter((o) => o.status === 'DELIVERED');
  const paidCents = filtered.reduce((sum, o) => sum + (o.amountPaidCents || 0), 0);
  const marginCents = deliveredRows.reduce((sum, o) => sum + (o.marginCents || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Orders</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isLoadingOrders ? 'Loading…' : `${total} order${total !== 1 ? 's' : ''} shown`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        {isLoadingOrders ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 animate-pulse">
              <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
              <div className="h-8 w-16 bg-gray-100 rounded mb-2" />
              <div className="hidden sm:block h-3 w-28 bg-gray-100 rounded" />
            </div>
          ))
        ) : (
          <>
            {summaryCard('Orders', String(total), 'Matching the current filters')}
            {summaryCard('Delivered', String(deliveredRows.length), 'Headshots sent to the customer', 'text-green-700')}
            {summaryCard('Paid', usd(paidCents), 'Gross across these orders')}
            {summaryCard(
              'Stuck now',
              String(stuckCount),
              stuckAfterMinutes ? `Sitting over ${stuckAfterMinutes} min` : 'Not moving',
              stuckCount > 0 ? 'text-amber-700' : 'text-gray-900',
            )}
          </>
        )}
      </div>

      {selectedRows.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary-200 bg-primary-50 px-4 py-2.5">
          <p className="text-sm font-semibold text-primary-900">
            {selectedRows.length} selected
          </p>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors"
          >
            Clear
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setConfirmingDelete(true)}
            disabled={isBulkDeleting}
            className="inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isBulkDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {isBulkDeleting ? 'Deleting…' : 'Delete selected'}
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 w-full">
        <AdminSearchInput
          value={localSearch}
          onChange={setLocalSearch}
          placeholder="Search by email or order id..."
          className="flex-1 sm:max-w-sm"
        />
        <div className="flex-1" />
        <button
          onClick={() => setFiltersOpen(true)}
          title="Filters"
          aria-label="Filters"
          className="relative shrink-0 flex items-center text-gray-800 hover:text-black transition-colors"
        >
          <SlidersHorizontal size={18} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 flex items-center justify-center text-[9px] font-bold text-white bg-primary-600 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {filtersOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-5 max-h-[85vh] overflow-y-auto"
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
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Status
              </label>
              {statusControl('w-full')}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Attention
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={urlStuck}
                  onChange={(e) => setParam('stuck', e.target.checked ? '1' : '')}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Only orders that are stuck
              </label>
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

      {confirmingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmingDelete(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900">
              Delete {selectedRows.length} order{selectedRows.length === 1 ? '' : 's'}?
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              This removes each order record and the customer&apos;s uploaded photos from our
              storage. It cannot be undone. AI-generated images are hosted by Replicate and
              expire on their own.
            </p>
            {paidUnrefunded > 0 && (
              <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  {paidUnrefunded} of these {paidUnrefunded === 1 ? 'was' : 'were'} paid and not
                  refunded. Deleting {paidUnrefunded === 1 ? 'it' : 'them'} destroys our only
                  record of that payment. Refund first if the customer is owed money.
                </p>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmingDelete(false)}
                className="flex-1 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={runBulkDelete}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition"
              >
                Delete {selectedRows.length}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoadingOrders ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Camera size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">No orders found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting the filters above.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someOnPageSelected;
                        }}
                        onChange={toggleAllOnPage}
                        aria-label="Select all orders on this page"
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                    </th>
                    {['Customer', 'Status', 'Paid', 'Compute', 'Margin', 'Waiting', 'Created', ''].map((h, i) => (
                      <th
                        key={i}
                        className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((o) => (
                    <tr
                      key={o.orderId}
                      className={`transition-colors group ${
                        selected.has(o.orderId) ? 'bg-primary-50/60' : 'hover:bg-gray-50/60'
                      }`}
                    >
                      <td className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(o.orderId)}
                          onChange={() => toggleOne(o.orderId)}
                          aria-label={`Select order ${o.orderId}`}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${o.orderId}`}
                          className="font-semibold text-gray-900 leading-snug hover:text-primary-700 hover:underline transition-colors"
                        >
                          {o.customerEmail || '—'}
                        </Link>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{o.orderId}</p>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={o.status} />
                      </td>

                      <td className="px-4 py-3 text-sm font-semibold text-gray-700 whitespace-nowrap">
                        {usd(o.amountPaidCents)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {usd(o.computeCostCents)}
                      </td>

                      <td
                        className={`px-4 py-3 text-sm font-semibold whitespace-nowrap ${
                          o.marginCents == null
                            ? 'text-gray-400'
                            : o.marginCents < 0
                              ? 'text-red-600'
                              : 'text-green-700'
                        }`}
                      >
                        {o.marginCents == null ? '—' : usd(o.marginCents)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {o.stuck ? (
                          <StuckBadge minutes={o.stuckForMinutes} />
                        ) : o.stuckForMinutes != null ? (
                          <span className="text-sm text-gray-400">{o.stuckForMinutes}m</span>
                        ) : (
                          <span className="text-sm text-gray-300">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                        {dateTime(o.createdAt)}
                      </td>

                      <td className="px-4 py-3 w-20">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/orders/${o.orderId}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition"
                            title="View details"
                          >
                            <ArrowUpRight size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-400">
                  Page {safePage} of {totalPages} · {total} total
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={safePage === 1}
                    onClick={() => goToPage(safePage - 1)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    disabled={safePage === totalPages}
                    onClick={() => goToPage(safePage + 1)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
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

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
