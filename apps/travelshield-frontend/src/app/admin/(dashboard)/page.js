'use client';

import Link from 'next/link';
import { useQueries } from '@tanstack/react-query';
import {
  ClipboardList,
  CircleDollarSign,
  ShieldCheck,
  Handshake,
  BookOpen,
  Globe,
  Users,
  ArrowRight,
  CalendarDays,
} from 'lucide-react';
import StatCard from '@travel-suite/frontend-shared/components/v2/admin/dashboard/StatCard';
import RecentApplicationsTable from '@travel-suite/frontend-shared/components/v2/admin/dashboard/RecentApplicationsTable';
import { getInsuranceApplicationsApi } from '@travel-suite/frontend-shared/services/apiInsurance';
import { getInsuranceApplicationsSummaryApi } from '@travel-suite/frontend-shared/services/apiInsurance';
import { getAffiliatesApi } from '@travel-suite/frontend-shared/services/apiAffiliates';
import { getAllBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import { useAdminAuth } from '@travel-suite/frontend-shared/contexts/AdminAuthContext';

/* --- Helpers ----------------------------------------------------------------- */

function fmtRevenue(amount) {
  return `AED ${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* --- Skeleton ---------------------------------------------------------------- */

function StatSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-gray-100" />
      <div className="h-7 w-20 bg-gray-100 rounded-lg" />
      <div className="h-3 w-28 bg-gray-100 rounded" />
    </div>
  );
}

/* --- Section card ------------------------------------------------------------ */

function SectionCard({ title, subtitle, children, action }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="font-bold text-gray-900 text-sm">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* --- Page -------------------------------------------------------------------- */

export default function DashboardPage() {
  const { adminUser } = useAdminAuth();
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const results = useQueries({
    queries: [
      {
        queryKey: ['dashboard', 'summary'],
        queryFn: () => getInsuranceApplicationsSummaryApi(),
      },
      {
        queryKey: ['dashboard', 'recent'],
        queryFn: () => getInsuranceApplicationsApi({ limit: 5 }),
      },
      {
        queryKey: ['dashboard', 'affiliates'],
        queryFn: () => getAffiliatesApi({ limit: 500 }),
      },
      {
        queryKey: ['dashboard', 'blogs', 'published'],
        queryFn: () => getAllBlogsApi({ status: 'published', limit: 1 }),
      },
      {
        queryKey: ['dashboard', 'blogs', 'draft'],
        queryFn: () => getAllBlogsApi({ status: 'draft', limit: 1 }),
      },
      {
        queryKey: ['dashboard', 'blogs', 'scheduled'],
        queryFn: () => getAllBlogsApi({ status: 'scheduled', limit: 1 }),
      },
    ],
  });

  const [summaryQ, recentQ, affiliatesQ, publishedQ, draftQ, scheduledQ] =
    results;

  /* -- Derived values -- */
  const totalApplications = summaryQ.data?.totalApplications ?? 0;
  const paidApplications = summaryQ.data?.paidApplications ?? 0;
  const pendingApplications = summaryQ.data?.pendingApplications ?? 0;
  const failedApplications = summaryQ.data?.failedApplications ?? 0;
  const refundedApplications = summaryQ.data?.refundedApplications ?? 0;
  const totalRevenue = Number(summaryQ.data?.totalRevenue?.amount || 0);
  const activeAffiliates = (affiliatesQ.data?.affiliates ?? []).filter(
    (a) => a.isActive,
  ).length;
  const recentApplications = recentQ.data?.data ?? [];

  const paidRatio =
    totalApplications > 0
      ? Math.round((paidApplications / totalApplications) * 100)
      : 0;

  const journeyBreakdown = [
    {
      label: 'Single Trip',
      count: summaryQ.data?.journeyBreakdown?.single ?? 0,
      color: 'bg-primary-500',
    },
    {
      label: 'Annual',
      count: summaryQ.data?.journeyBreakdown?.annual ?? 0,
      color: 'bg-accent-500',
    },
    {
      label: '2-Year',
      count: summaryQ.data?.journeyBreakdown?.biennial ?? 0,
      color: 'bg-purple-400',
    },
  ];

  const blogStats = {
    published: publishedQ.data?.pagination?.total ?? 0,
    draft: draftQ.data?.pagination?.total ?? 0,
    scheduled: scheduledQ.data?.pagination?.total ?? 0,
  };

  const statsLoading = summaryQ.isPending;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* -- Page header -- */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
            <CalendarDays size={13} />
            {today}
          </p>
        </div>
        <Link
          href="/admin/insurance-applications"
          className="shrink-0 flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <ClipboardList size={14} />
          View Applications
        </Link>
      </div>

      {/* -- Stat cards -- */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={ClipboardList}
              iconBg="bg-primary-50"
              iconColor="text-primary-700"
              label="Total Applications"
              value={totalApplications.toLocaleString()}
              sub="All time"
            />
            <StatCard
              icon={CircleDollarSign}
              iconBg="bg-green-50"
              iconColor="text-green-600"
              label="Total Revenue"
              value={fmtRevenue(totalRevenue)}
              sub="Paid policies only"
            />
            <StatCard
              icon={ShieldCheck}
              iconBg="bg-accent-50"
              iconColor="text-accent-600"
              label="Paid Policies"
              value={paidApplications.toLocaleString()}
              sub={`${paidRatio}% of total`}
            />
            <StatCard
              icon={Handshake}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
              label="Active Affiliates"
              value={activeAffiliates.toLocaleString()}
              sub="Currently active"
            />
          </>
        )}
      </div>

      {/* -- Main content: table + sidebar -- */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
        {/* Recent Applications */}
        <RecentApplicationsTable applications={recentApplications} />

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          {/* Payment status */}
          <SectionCard title="Payment Status" subtitle="All applications">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-green-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    Paid
                  </span>
                  <span className="font-bold text-gray-700">
                    {paidApplications}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${paidRatio}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-amber-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    Unpaid / Other
                  </span>
                  <span className="font-bold text-gray-700">
                    {totalApplications - paidApplications}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${100 - paidRatio}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="rounded-xl bg-gray-50 px-3 py-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    Pending
                  </p>
                  <p className="text-sm font-semibold text-blue-700">
                    {pendingApplications}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 px-3 py-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    Failed
                  </p>
                  <p className="text-sm font-semibold text-red-700">
                    {failedApplications}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 px-3 py-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    Refunded
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    {refundedApplications}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Journey type breakdown */}
          <SectionCard title="Journey Types" subtitle="By trip category">
            <div className="space-y-2.5">
              {journeyBreakdown.map(({ label, count, color }) => {
                const pct =
                  totalApplications > 0
                    ? Math.round((count / totalApplications) * 100)
                    : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">{label}</span>
                      <span className="font-bold text-gray-700">{count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Blog summary */}
          <SectionCard
            title="Blog"
            subtitle="Post status overview"
            action={
              <Link
                href="/admin/blog"
                className="flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline"
              >
                Manage <ArrowRight size={11} />
              </Link>
            }
          >
            <div className="space-y-2">
              {[
                {
                  label: 'Published',
                  count: blogStats.published,
                  dot: 'bg-green-500',
                },
                { label: 'Draft', count: blogStats.draft, dot: 'bg-gray-400' },
                {
                  label: 'Scheduled',
                  count: blogStats.scheduled,
                  dot: 'bg-amber-400',
                },
              ].map(({ label, count, dot }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    {label}
                  </span>
                  <span className="text-xs font-bold text-gray-700">
                    {count}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/admin/blog/new"
              className="mt-4 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-primary-300 hover:text-primary-700 text-gray-400 text-xs font-semibold py-2 rounded-xl transition-colors"
            >
              <BookOpen size={13} />
              New post
            </Link>
          </SectionCard>

          {/* Quick links */}
          <SectionCard title="Quick Access" subtitle="Jump to a section">
            <div className="space-y-1">
              {[
                {
                  label: 'Users',
                  href: '/admin/users',
                  icon: Users,
                  roles: ['admin'],
                },
                {
                  label: 'Affiliates',
                  href: '/admin/affiliates',
                  icon: Handshake,
                  roles: ['admin', 'agent'],
                },
                {
                  label: 'Currencies',
                  href: '/admin/currencies',
                  icon: CircleDollarSign,
                  roles: ['admin', 'agent'],
                },
              ]
                .filter((item) => item.roles.includes(adminUser?.role))
                .map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 group transition-colors"
                  >
                    <span className="flex items-center gap-2.5 text-sm text-gray-600 font-medium group-hover:text-gray-900">
                      <Icon size={14} className="text-gray-400" />
                      {label}
                    </span>
                    <ArrowRight
                      size={13}
                      className="text-gray-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all"
                    />
                  </Link>
                ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
