'use client';

import Link from 'next/link';
import {
  Camera,
  DollarSign,
  TrendingUp,
  Cpu,
  AlertTriangle,
  Undo2,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import StatCard from '@travel-suite/frontend-shared/components/admin/StatCard';
import { useAdminStats } from '../../../hooks/admin/useAdminOrders';
import { usd, STATUS_LABEL } from '../../../lib/adminApi';

// Lifecycle order, so the row reads as the pipeline an operator watches.
const STATUS_ORDER = ['AWAITING_PAYMENT', 'PAID', 'TRAINING', 'GENERATING', 'DELIVERED', 'FAILED'];

const STATUS_DOT = {
  AWAITING_PAYMENT: 'bg-gray-400',
  PAID: 'bg-blue-400',
  TRAINING: 'bg-indigo-400',
  GENERATING: 'bg-purple-400',
  DELIVERED: 'bg-green-500',
  FAILED: 'bg-red-500',
};

export default function AdminDashboardPage() {
  const { stats, isLoadingStats } = useAdminStats();

  if (isLoadingStats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <p className="text-sm font-bold text-gray-600">Could not load metrics</p>
          <p className="text-xs text-gray-400 mt-1">Try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const marginPct =
    stats.deliveredRevenueCents > 0
      ? Math.round((stats.deliveredMarginCents / stats.deliveredRevenueCents) * 100)
      : null;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Revenue, margin, and where every order stands right now.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <StatCard
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          label="Delivered revenue"
          value={usd(stats.deliveredRevenueCents)}
          sub={`${stats.deliveredCount} delivered`}
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-primary-700"
          iconBg="bg-primary-50"
          label="Delivered margin"
          value={usd(stats.deliveredMarginCents)}
          sub={marginPct == null ? 'No deliveries yet' : `${marginPct}% of revenue`}
        />
        <StatCard
          icon={Cpu}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          label="Compute cost"
          value={usd(stats.computeCostCents)}
          sub="Across all orders"
        />
        <StatCard
          icon={Camera}
          iconColor="text-gray-600"
          iconBg="bg-gray-100"
          label="Total orders"
          value={String(stats.totalOrders)}
          sub={`${usd(stats.revenueCents)} gross paid`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">By status</h3>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-primary-700 transition-colors"
            >
              All orders
              <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {STATUS_ORDER.map((s) => (
              <Link
                key={s}
                href={`/admin/orders?status=${s}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/60 transition-colors group"
              >
                <span className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s]}`} />
                  {STATUS_LABEL[s] ?? s}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-gray-900">
                    {stats.byStatus?.[s] ?? 0}
                  </span>
                  <ArrowUpRight
                    size={13}
                    className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div
            className={`bg-white border rounded-2xl p-4 ${
              stats.stuckCount > 0 ? 'border-amber-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle
                size={14}
                className={stats.stuckCount > 0 ? 'text-amber-600' : 'text-gray-300'}
              />
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                Stuck now
              </p>
            </div>
            <p
              className={`text-2xl font-extrabold ${
                stats.stuckCount > 0 ? 'text-amber-700' : 'text-gray-900'
              }`}
            >
              {stats.stuckCount}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Sitting in one state over {stats.stuckAfterMinutes} min
            </p>
            {stats.stuckCount > 0 && (
              <Link
                href="/admin/orders?stuck=1"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors"
              >
                Review them
                <ArrowUpRight size={12} />
              </Link>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Undo2 size={14} className={stats.refundedCount > 0 ? 'text-red-500' : 'text-gray-300'} />
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Refunded</p>
            </div>
            <p
              className={`text-2xl font-extrabold ${
                stats.refundedCount > 0 ? 'text-red-700' : 'text-gray-900'
              }`}
            >
              {stats.refundedCount}
            </p>
            <p className="text-xs text-gray-400 mt-1">Orders refunded to the customer</p>
          </div>
        </div>
      </div>
    </div>
  );
}
