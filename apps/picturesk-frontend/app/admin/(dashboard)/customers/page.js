'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Users, ChevronLeft, ChevronRight, Loader2, ArrowUpRight } from 'lucide-react';
import AdminSearchInput from '@travel-suite/frontend-shared/components/admin/AdminSearchInput';
import { useAdminCustomers } from '../../../../hooks/admin/useAdminOrders';
import { usd, dateOnly } from '../../../../lib/adminApi';

const PAGE_SIZE = 25;

function AccountBadge({ hasAccount }) {
  return hasAccount ? (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      Account
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-gray-100 text-gray-600 border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Guest
    </span>
  );
}

function CustomersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get('search') ?? '';
  const page = Number(searchParams.get('page') || 1);

  const [localSearch, setLocalSearch] = useState(urlSearch);
  useEffect(() => setLocalSearch(urlSearch), [urlSearch]);

  const { customers, isLoadingCustomers } = useAdminCustomers();

  useEffect(() => {
    if (localSearch === urlSearch) return;
    const t = setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString());
      if (localSearch) p.set('search', localSearch);
      else p.delete('search');
      p.delete('page');
      router.push(`${pathname}?${p.toString()}`);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch, urlSearch]);

  // The API aggregates the newest 200 customers and has no text search, so email
  // matching and paging happen here. Move both server-side if this grows.
  const needle = urlSearch.trim().toLowerCase();
  const filtered = needle
    ? customers.filter((c) => (c.email || '').toLowerCase().includes(needle))
    : customers;

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function goToPage(p) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const withAccount = filtered.filter((c) => c.hasAccount).length;
  const lifetimeCents = filtered.reduce((sum, c) => sum + (c.totalPaidCents || 0), 0);
  const repeat = filtered.filter((c) => c.orders > 1).length;

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

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Users</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          {isLoadingCustomers ? 'Loading…' : `${total} user${total !== 1 ? 's' : ''} shown`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        {isLoadingCustomers ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 animate-pulse">
              <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
              <div className="h-8 w-16 bg-gray-100 rounded mb-2" />
              <div className="hidden sm:block h-3 w-28 bg-gray-100 rounded" />
            </div>
          ))
        ) : (
          <>
            {summaryCard('Users', String(total), 'Unique email addresses')}
            {summaryCard('Lifetime paid', usd(lifetimeCents), 'Gross across these users', 'text-green-700')}
            {summaryCard('Repeat buyers', String(repeat), 'More than one order')}
            {summaryCard('With an account', String(withAccount), 'Rest checked out as guests')}
          </>
        )}
      </div>

      <div className="flex items-center gap-3 w-full">
        <AdminSearchInput
          value={localSearch}
          onChange={setLocalSearch}
          placeholder="Search by email..."
          className="flex-1 sm:max-w-sm"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoadingCustomers ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Users size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">No users found</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['User', 'Orders', 'Delivered', 'Lifetime paid', 'Last order', ''].map((h, i) => (
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
                  {rows.map((c) => (
                    <tr key={c.email} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders?search=${encodeURIComponent(c.email)}`}
                          className="font-semibold text-gray-900 leading-snug hover:text-primary-700 hover:underline transition-colors break-all"
                        >
                          {c.email}
                        </Link>
                        <div className="mt-1">
                          <AccountBadge hasAccount={c.hasAccount} />
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700 font-semibold whitespace-nowrap">
                        {c.orders}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {c.delivered}
                      </td>

                      <td className="px-4 py-3 text-sm font-semibold text-gray-700 whitespace-nowrap">
                        {usd(c.totalPaidCents)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                        {dateOnly(c.lastOrderAt)}
                      </td>

                      <td className="px-4 py-3 w-20">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/orders?search=${encodeURIComponent(c.email)}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition"
                            title="See this user's orders"
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

export default function AdminCustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      }
    >
      <CustomersContent />
    </Suspense>
  );
}
