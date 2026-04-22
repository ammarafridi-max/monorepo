'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ClipboardList, ChevronLeft, ChevronRight,
  Loader2, ArrowUpRight, Trash2, RefreshCw, Search,
} from 'lucide-react';
import { useGetInsuranceApplications } from '@travel-suite/frontend-shared/hooks/insurance/useGetInsuranceApplications';
import { useDeleteInsuranceApplication } from '@travel-suite/frontend-shared/hooks/insurance/useDeleteInsuranceApplication';
import { useCreateNationalities } from '@travel-suite/frontend-shared/hooks/insurance/useCreateNationalities';
import { useGetInsuranceApplicationsSummary } from '@travel-suite/frontend-shared/hooks/insurance/useGetInsuranceApplicationsSummary';

/* --- Config ----------------------------------------------------------------- */

const PAYMENT_TABS = [
  { value: '',         label: 'All'      },
  { value: 'PAID',     label: 'Paid'     },
  { value: 'UNPAID',   label: 'Unpaid'   },
  { value: 'PENDING',  label: 'Pending'  },
  { value: 'FAILED',   label: 'Failed'   },
  { value: 'REFUNDED', label: 'Refunded' },
];

const JOURNEY_TABS = [
  { value: '',         label: 'All'      },
  { value: 'single',   label: 'Single'   },
  { value: 'annual',   label: 'Annual'   },
  { value: 'biennial', label: 'Biennial' },
];

/* --- Badges ----------------------------------------------------------------- */

const PAYMENT_CFG = {
  PAID:     { dot: 'bg-green-500',  cls: 'bg-green-50   text-green-700   border-green-200' },
  UNPAID:   { dot: 'bg-amber-400',  cls: 'bg-amber-50   text-amber-700   border-amber-200' },
  PENDING:  { dot: 'bg-blue-400',   cls: 'bg-blue-50    text-blue-700    border-blue-200'  },
  FAILED:   { dot: 'bg-red-500',    cls: 'bg-red-50     text-red-700     border-red-200'   },
  REFUNDED: { dot: 'bg-gray-400',   cls: 'bg-gray-100   text-gray-600    border-gray-200'  },
};

const JOURNEY_CFG = {
  single:   'bg-blue-50   text-blue-700   border-blue-200',
  annual:   'bg-purple-50 text-purple-700 border-purple-200',
  biennial: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

function PaymentBadge({ status }) {
  const cfg = PAYMENT_CFG[status] ?? { dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {{ PAID: 'Paid', UNPAID: 'Unpaid', PENDING: 'Pending', FAILED: 'Failed', REFUNDED: 'Refunded' }[status] ?? status}
    </span>
  );
}

function JourneyBadge({ type }) {
  const cls = JOURNEY_CFG[type] ?? 'bg-gray-100 text-gray-500 border-gray-200';
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {type ? type.charAt(0).toUpperCase() + type.slice(1) : '—'}
    </span>
  );
}

/* --- Helpers ---------------------------------------------------------------- */

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtAmount(amountPaid) {
  if (!amountPaid?.amount) return '—';
  return `${amountPaid.currency ?? ''} ${Number(amountPaid.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`.trim();
}

function leadName(app) {
  if (app.leadPassenger) return app.leadPassenger;
  const p = app.passengers?.[0];
  if (!p) return '—';
  const name = [p.firstName, p.lastName].filter(Boolean).join(' - ');
  return [p.title, name].filter(Boolean).join(' ') || '—';
}

/* --- Filter pill ------------------------------------------------------------ */

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

/* --- Main content (inside Suspense — uses useSearchParams) ------------------ */

function ApplicationsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const { applications = [], pagination, isLoadingApplications } = useGetInsuranceApplications();
  const { summary, isLoadingSummary }                              = useGetInsuranceApplicationsSummary();
  const { deleteInsuranceApplication, isDeleting }               = useDeleteInsuranceApplication();
  const { createNationalities, isCreatingNationalities }         = useCreateNationalities();

  const page          = Number(searchParams.get('page')          || 1);
  const paymentFilter = searchParams.get('paymentStatus')        || '';
  const journeyFilter = searchParams.get('journeyType')          || '';
  const totalPages    = pagination?.totalPages                   ?? 1;
  const total         = pagination?.total                        ?? 0;
  const search        = searchParams.get('search')               ?? '';
  const createdAt     = searchParams.get('createdAt')            ?? 'all_time';

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

  function summaryCard(label, value, sub, accent = 'text-gray-900') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
        <p className={`text-2xl font-extrabold ${accent}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Applications</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isLoadingApplications ? 'Loading…' : `${total} application${total !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <button
          onClick={() => createNationalities()}
          disabled={isCreatingNationalities}
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          title="Fetch nationalities from WIS and save to database"
        >
          <RefreshCw size={13} className={isCreatingNationalities ? 'animate-spin' : ''} />
          {isCreatingNationalities ? 'Refreshing…' : 'Refresh Nationalities'}
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoadingSummary ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse">
              <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
              <div className="h-8 w-16 bg-gray-100 rounded mb-2" />
              <div className="h-3 w-28 bg-gray-100 rounded" />
            </div>
          ))
        ) : (
          <>
            {summaryCard('Total Applications', String(summary?.totalApplications ?? 0), 'Across all payment states')}
            {summaryCard('Paid Revenue', `${summary?.totalRevenue?.currency ?? 'AED'} ${Number(summary?.totalRevenue?.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Confirmed paid policies', 'text-green-700')}
            {summaryCard('Pending Review', String(summary?.pendingApplications ?? 0), 'Applications awaiting outcome', 'text-blue-700')}
            {summaryCard('Failed / Refunded', String((summary?.failedApplications ?? 0) + (summary?.refundedApplications ?? 0)), 'Requires operations follow-up', 'text-red-700')}
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setParam('search', e.target.value)}
            placeholder="Search by email, name, session, policy..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Status</span>
          {PAYMENT_TABS.map(({ value, label }) => (
            <FilterPill key={value} label={label} active={paymentFilter === value} onClick={() => setParam('paymentStatus', value)} />
          ))}
        </div>
        <div className="w-px h-5 bg-gray-200 hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Journey</span>
          {JOURNEY_TABS.map(({ value, label }) => (
            <FilterPill key={value} label={label} active={journeyFilter === value} onClick={() => setParam('journeyType', value)} />
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
            <option value="all_time">All time</option>
            <option value="24_hours">Last 24 hours</option>
            <option value="7_days">Last 7 days</option>
            <option value="30_days">Last 30 days</option>
            <option value="90_days">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoadingApplications ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <ClipboardList size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">No applications found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting the filters above.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['Lead Passenger', 'Email', 'Region', 'Journey', 'Dates', 'Amount', 'Status', 'Created', ''].map((h, i) => (
                      <th key={i} className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {applications.map((app) => (
                    <tr key={app.sessionId} className="hover:bg-gray-50/60 transition-colors group">

                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 leading-snug">{leadName(app)}</p>
                        {app.policyNumber && (
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{app.policyNumber}</p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate">{app.email}</td>

                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {app.region?.name ?? '—'}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <JourneyBadge type={app.journeyType} />
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {fmtDate(app.startDate)} → {fmtDate(app.endDate)}
                      </td>

                      <td className="px-4 py-3 text-sm font-semibold text-gray-700 whitespace-nowrap">
                        {fmtAmount(app.amountPaid)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <PaymentBadge status={app.paymentStatus} />
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                        {fmtDate(app.createdAt)}
                      </td>

                      <td className="px-4 py-3 w-20">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/insurance-applications/${app.sessionId}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition"
                            title="View details"
                          >
                            <ArrowUpRight size={14} />
                          </Link>
                          <button
                            onClick={() => deleteInsuranceApplication(app.sessionId)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                            title="Delete"
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

/* --- Page ------------------------------------------------------------------- */

export default function ApplicationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    }>
      <ApplicationsContent />
    </Suspense>
  );
}
