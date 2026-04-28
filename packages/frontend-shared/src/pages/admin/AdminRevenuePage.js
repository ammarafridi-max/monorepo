'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  Receipt,
  Wallet,
  ExternalLink,
} from 'lucide-react';
import Breadcrumb from '../../components/v1/layout/Breadcrumb';
import PageLoader from '../../components/v1/ui/PageLoader';
import PageHeading from '../../components/v1/layout/PageHeading';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useRevenue } from '../../hooks/payments/useRevenue';
import { useCharges } from '../../hooks/payments/useCharges';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RANGES = [
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
];

function rangeToTimestamps(rangeId) {
  const range = RANGES.find((r) => r.id === rangeId) || RANGES[1];
  const to = Math.floor(Date.now() / 1000);
  const from = to - range.days * 24 * 60 * 60;
  return { from, to };
}

function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'AED').toUpperCase(),
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${(currency || '').toUpperCase()} ${amount.toFixed(2)}`;
  }
}

function formatTimestamp(unixSeconds) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(unixSeconds * 1000));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminRevenuePage() {
  const router = useRouter();
  const { adminUser: user, isLoadingAdminAuth: loading } = useAdminAuth();
  const isAdmin = user?.role === 'admin';

  const [rangeId, setRangeId] = useState('30d');
  const { from, to } = useMemo(() => rangeToTimestamps(rangeId), [rangeId]);

  const { revenue, isLoadingRevenue } = useRevenue({ from, to });
  const { charges, isLoadingCharges } = useCharges({ from, to, limit: 25 });

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/admin');
  }, [isAdmin, loading, router]);

  if (loading || !isAdmin) return <PageLoader />;

  const currencies = revenue?.byCurrency
    ? Object.keys(revenue.byCurrency).sort()
    : [];
  const primaryCurrency = currencies[0]; // for the chart
  const primaryStats = primaryCurrency
    ? revenue.byCurrency[primaryCurrency]
    : null;

  return (
    <>
      <Breadcrumb
        paths={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Revenue', href: '/admin/revenue' },
        ]}
      />
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <PageHeading>Revenue</PageHeading>
        <RangeSelector value={rangeId} onChange={setRangeId} />
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoadingRevenue ? (
          <SkeletonCards />
        ) : currencies.length === 0 ? (
          <EmptyKpis />
        ) : (
          currencies.map((cur) => {
            const stats = revenue.byCurrency[cur];
            return (
              <div key={cur} className="grid grid-cols-1 gap-4 lg:contents">
                <Kpi
                  icon={Wallet}
                  label={`Net revenue (${cur.toUpperCase()})`}
                  value={formatMoney(stats.net, cur)}
                  hint={`Gross ${formatMoney(stats.gross, cur)}`}
                />
                <Kpi
                  icon={Receipt}
                  label={`Charges (${cur.toUpperCase()})`}
                  value={String(stats.count)}
                />
                <Kpi
                  icon={TrendingUp}
                  label={`Avg ticket (${cur.toUpperCase()})`}
                  value={formatMoney(stats.average, cur)}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Chart */}
      {primaryStats?.byDay?.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Daily revenue ({primaryCurrency.toUpperCase()})
            </h2>
            <span className="text-xs text-gray-500">{RANGES.find((r) => r.id === rangeId)?.label}</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={primaryStats.byDay} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => v.toLocaleString()}
                />
                <Tooltip
                  formatter={(v) => formatMoney(Number(v), primaryCurrency)}
                  labelFormatter={(d) => d}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#1a1a2e"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Charges table */}
      <div className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Recent charges</h2>
          <span className="text-xs text-gray-500">Showing up to 25</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Date</th>
                <th className="px-5 py-3 text-left font-medium">Customer</th>
                <th className="px-5 py-3 text-left font-medium">Description</th>
                <th className="px-5 py-3 text-left font-medium">Type</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingCharges ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                    Loading…
                  </td>
                </tr>
              ) : charges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                    No charges in this period.
                  </td>
                </tr>
              ) : (
                charges.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-5 py-3 text-gray-600">
                      {formatTimestamp(c.created)}
                    </td>
                    <td className="px-5 py-3 text-gray-900">
                      <div className="font-medium">{c.customerName || '—'}</div>
                      {c.customerEmail && (
                        <div className="text-xs text-gray-500">{c.customerEmail}</div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {c.description || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {c.productType || 'other'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-gray-900">
                      {formatMoney(c.amount, c.currency)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill charge={c} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      {c.receiptUrl ? (
                        <a
                          href={c.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary-700 hover:underline"
                        >
                          View <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RangeSelector({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
      {RANGES.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onChange(r.id)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === r.id
              ? 'bg-primary-700 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
        <Icon size={14} />
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
    </div>
  );
}

function SkeletonCards() {
  return [0, 1, 2].map((i) => (
    <div
      key={i}
      className="h-24 animate-pulse rounded-2xl border border-gray-100 bg-white"
    />
  ));
}

function EmptyKpis() {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
      No revenue in the selected period.
    </div>
  );
}

function StatusPill({ charge }) {
  if (charge.refunded) {
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
        Refunded
      </span>
    );
  }
  if (charge.paid && charge.status === 'succeeded') {
    return (
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        Paid
      </span>
    );
  }
  return (
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      {charge.status}
    </span>
  );
}
