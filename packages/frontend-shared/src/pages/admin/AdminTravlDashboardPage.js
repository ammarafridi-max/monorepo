'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  ShieldCheck,
  CircleDollarSign,
  Handshake,
  BookOpen,
  Users,
  ArrowRight,
  CalendarDays,
  DollarSign,
  Inbox,
  Stamp,
  Mail,
  ChevronRight,
} from 'lucide-react';
import StatCard from '../../components/admin/v1/StatCard';
import { getInsuranceApplicationsApi, getInsuranceApplicationsSummaryApi } from '../../services/apiInsurance';
import { getAdminVisaLeadsApi } from '../../services/apiVisaLeads';
import { getAffiliatesApi } from '../../services/apiAffiliates';
import { getAllBlogsApi } from '../../services/apiBlog';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const VISA_LEAD_STATUS_CFG = {
  new:       { label: 'New',       dot: 'bg-blue-500',   text: 'text-blue-700'   },
  contacted: { label: 'Contacted', dot: 'bg-amber-500',  text: 'text-amber-700'  },
  qualified: { label: 'Qualified', dot: 'bg-indigo-500', text: 'text-indigo-700' },
  converted: { label: 'Converted', dot: 'bg-green-500',  text: 'text-green-700'  },
  lost:      { label: 'Lost',      dot: 'bg-gray-400',   text: 'text-gray-500'   },
};

function fmtMoney(amount, currency = 'AED') {
  return `${currency} ${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(iso) {
  if (!iso) return '—';
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60)    return 'just now';
  if (secs < 3600)  { const m = Math.floor(secs / 60);    return `${m}m ago`; }
  if (secs < 86400) { const h = Math.floor(secs / 3600);  return `${h}h ago`; }
  const d = Math.floor(secs / 86400);
  return d < 7 ? `${d}d ago` : fmtDate(iso);
}

function leadName(app) {
  if (app.leadPassenger) return app.leadPassenger;
  const p = app.passengers?.[0];
  if (!p) return '—';
  return [[p.title, [p.firstName, p.lastName].filter(Boolean).join(' ')].filter(Boolean).join(' ')].join('') || '—';
}

function StatSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-gray-100" />
      <div className="h-7 w-20 bg-gray-100 rounded-lg" />
      <div className="h-3 w-28 bg-gray-100 rounded" />
    </div>
  );
}

function SectionCard({ title, subtitle, children, action }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="font-bold text-gray-900 text-sm">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const PAYMENT_BADGE = {
  PAID:     'bg-green-50 text-green-700 border-green-200',
  PENDING:  'bg-blue-50 text-blue-700 border-blue-200',
  FAILED:   'bg-red-50 text-red-700 border-red-200',
  REFUNDED: 'bg-gray-100 text-gray-500 border-gray-200',
  UNPAID:   'bg-amber-50 text-amber-700 border-amber-200',
};

function PaymentBadge({ status }) {
  const cls = PAYMENT_BADGE[status] ?? 'bg-gray-100 text-gray-500 border-gray-200';
  const labels = { PAID: 'Paid', PENDING: 'Pending', FAILED: 'Failed', REFUNDED: 'Refunded', UNPAID: 'Unpaid' };
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {labels[status] ?? status}
    </span>
  );
}

function DashboardContent() {
  const { adminUser } = useAdminAuth();
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const isAgent = adminUser?.role === 'agent';

  const results = useQueries({
    queries: [
      {
        queryKey: ['dashboard-travl', 'insurance-summary'],
        queryFn: getInsuranceApplicationsSummaryApi,
      },
      {
        queryKey: ['dashboard-travl', 'recent-insurance'],
        queryFn: () => getInsuranceApplicationsApi({ limit: 6, page: 1 }),
      },
      {
        queryKey: ['dashboard-travl', 'visa-leads-new'],
        queryFn: () => getAdminVisaLeadsApi({ status: 'new', limit: 1 }),
      },
      {
        queryKey: ['dashboard-travl', 'visa-leads-total'],
        queryFn: () => getAdminVisaLeadsApi({ limit: 1 }),
      },
      {
        queryKey: ['dashboard-travl', 'affiliates'],
        queryFn: () => getAffiliatesApi({ limit: 500 }),
      },
      {
        queryKey: ['dashboard-travl', 'blogs', 'published'],
        queryFn: () => getAllBlogsApi({ status: 'published', limit: 1 }),
      },
      {
        queryKey: ['dashboard-travl', 'blogs', 'draft'],
        queryFn: () => getAllBlogsApi({ status: 'draft', limit: 1 }),
      },
      {
        queryKey: ['dashboard-travl', 'blogs', 'scheduled'],
        queryFn: () => getAllBlogsApi({ status: 'scheduled', limit: 1 }),
      },
    ],
  });

  const [summaryQ, recentInsQ, newLeadsQ, totalLeadsQ, affiliatesQ, publishedQ, draftQ, scheduledQ] = results;

  const summary = summaryQ.data ?? {};
  const recentApplications = recentInsQ.data?.data ?? [];
  const newLeadsTotal   = newLeadsQ.data?.pagination?.total ?? 0;
  const totalLeads      = totalLeadsQ.data?.pagination?.total ?? 0;
  const activeAffiliates = (affiliatesQ.data?.affiliates ?? []).filter((a) => a.isActive).length;

  const insTotal    = summary.totalApplications ?? 0;
  const insRevenue  = summary.totalRevenue ?? { amount: 0, currency: 'AED' };
  const insPending  = summary.pendingApplications ?? 0;
  const insFailed   = (summary.failedApplications ?? 0) + (summary.refundedApplications ?? 0);
  const insPaid     = insTotal - insPending - insFailed;

  const blogStats = {
    published: publishedQ.data?.pagination?.total ?? 0,
    draft:     draftQ.data?.pagination?.total ?? 0,
    scheduled: scheduledQ.data?.pagination?.total ?? 0,
  };

  const statsLoading = summaryQ.isPending;

  return (
    <div className="max-w-7xl mx-auto space-y-6">

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
          <ShieldCheck size={14} />
          View Insurance
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-1 [&>*]:min-w-[180px] [&>*]:shrink-0 xl:[&>*]:flex-1 xl:[&>*]:min-w-0">
        {statsLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            {!isAgent && (
              <StatCard
                icon={DollarSign}
                iconBg="bg-green-50"
                iconColor="text-green-600"
                label="Insurance Revenue"
                value={fmtMoney(insRevenue.amount, insRevenue.currency)}
                sub="Paid policies only"
              />
            )}
            <StatCard
              icon={ShieldCheck}
              iconBg="bg-accent-50"
              iconColor="text-accent-600"
              label="Total Applications"
              value={insTotal.toLocaleString()}
              sub="All time"
            />
            <StatCard
              icon={Inbox}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              label="New Visa Leads"
              value={newLeadsTotal.toLocaleString()}
              sub={`${totalLeads} total leads`}
            />
            {!isAgent && (
              <StatCard
                icon={Handshake}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
                label="Active Affiliates"
                value={activeAffiliates.toLocaleString()}
                sub="Currently active"
              />
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">

        {/* Recent Insurance Applications */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <p className="font-bold text-gray-900 text-sm">Recent Insurance Applications</p>
              <p className="text-xs text-gray-400 mt-0.5">Latest submissions</p>
            </div>
            <Link
              href="/admin/insurance-applications"
              className="flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline"
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {recentApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <ShieldCheck size={20} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-400">No applications yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/60">
                    {['Lead Passenger', 'Journey', 'Dates', 'Amount', 'Status', 'Submitted', ''].map((h, i) => (
                      <th key={i} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentApplications.map((app) => (
                    <tr key={app.sessionId} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 leading-snug whitespace-nowrap">{leadName(app)}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{app.email}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-semibold text-gray-600 capitalize">{app.journeyType ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {fmtDate(app.startDate)} → {fmtDate(app.endDate)}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">
                        {app.amountPaid?.amount
                          ? fmtMoney(app.amountPaid.amount, app.amountPaid.currency)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <PaymentBadge status={app.paymentStatus} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {timeAgo(app.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/insurance-applications/${app.sessionId}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 flex"
                        >
                          <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">

          <SectionCard title="Insurance Status" subtitle="All applications">
            <div className="space-y-3">
              {[
                { label: 'Paid',     count: insPaid,    color: 'bg-green-500',  textCls: 'text-green-700'  },
                { label: 'Pending',  count: insPending, color: 'bg-blue-400',   textCls: 'text-blue-700'   },
                { label: 'Failed / Refunded', count: insFailed, color: 'bg-red-400', textCls: 'text-red-700' },
              ].map(({ label, count, color, textCls }) => {
                const pct = insTotal > 0 ? Math.round((count / insTotal) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`font-semibold ${textCls}`}>{label}</span>
                      <span className="font-bold text-gray-700">{count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title="Visa Leads"
            subtitle="By status"
            action={
              <Link href="/admin/visa-leads" className="flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline">
                View all <ArrowRight size={11} />
              </Link>
            }
          >
            <div className="space-y-2">
              {Object.entries(VISA_LEAD_STATUS_CFG).map(([status, cfg]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                  <span className="text-xs font-bold text-gray-700">—</span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">Total</span>
                <span className="text-xs font-bold text-gray-900">{totalLeads}</span>
              </div>
            </div>
            <Link
              href="/admin/visa-leads"
              className="mt-4 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-primary-300 hover:text-primary-700 text-gray-400 text-xs font-semibold py-2 rounded-xl transition-colors"
            >
              <Inbox size={13} />
              View leads
            </Link>
          </SectionCard>

          <SectionCard
            title="Blog"
            subtitle="Post status overview"
            action={
              <Link href="/admin/blog" className="flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline">
                Manage <ArrowRight size={11} />
              </Link>
            }
          >
            <div className="space-y-2">
              {[
                { label: 'Published', count: blogStats.published, dot: 'bg-green-500' },
                { label: 'Draft',     count: blogStats.draft,      dot: 'bg-gray-400'  },
                { label: 'Scheduled', count: blogStats.scheduled,  dot: 'bg-amber-400' },
              ].map(({ label, count, dot }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    {label}
                  </span>
                  <span className="text-xs font-bold text-gray-700">{count}</span>
                </div>
              ))}
            </div>
            <Link
              href="/admin/blog/create"
              className="mt-4 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-primary-300 hover:text-primary-700 text-gray-400 text-xs font-semibold py-2 rounded-xl transition-colors"
            >
              <BookOpen size={13} />
              New post
            </Link>
          </SectionCard>

          <SectionCard title="Quick Access" subtitle="Jump to a section">
            <div className="space-y-1">
              {[
                { label: 'Visa Pages',  href: '/admin/visa',        icon: Stamp,           roles: ['admin']          },
                { label: 'Emails',      href: '/admin/emails',       icon: Mail,            roles: ['admin', 'agent'] },
                { label: 'Affiliates',  href: '/admin/affiliates',   icon: Handshake,       roles: ['admin', 'agent'] },
                { label: 'Currencies',  href: '/admin/currencies',   icon: CircleDollarSign, roles: ['admin']          },
                { label: 'Users',       href: '/admin/users',        icon: Users,           roles: ['admin']          },
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
                    <ArrowRight size={13} className="text-gray-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  );
}

export default function AdminTravlDashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
