'use client';

import Link from 'next/link';
import { useQueries } from '@tanstack/react-query';
import {
  Inbox,
  ClipboardList,
  BookOpen,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import { getAdminVisaLeadsApi } from '../../services/apiVisaLeads';
import { adminListApplicationsApi } from '../../services/apiVisaApplications';
import { getAllBlogsApi } from '../../services/apiBlog';
import { useAdminAuth } from '../../contexts/AdminAuthContext';


const STATUS_STYLES = {
  new: 'bg-accent-50 text-accent-700 border-accent-200',
  contacted: 'bg-blue-50 text-blue-700 border-blue-200',
  qualified: 'bg-primary-50 text-primary-700 border-primary-200',
  converted: 'bg-green-50 text-green-700 border-green-200',
  lost: 'bg-gray-100 text-gray-500 border-gray-200',
};

function StatusPill({ status }) {
  const cls = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${cls}`}>
      {status || 'unknown'}
    </span>
  );
}

function timeAgo(value) {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function leadName(lead) {
  return [lead?.firstName, lead?.lastName].filter(Boolean).join(' ') || '—';
}

function SectionCard({ title, href, linkLabel, children, empty }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {href && (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800 transition-colors"
          >
            {linkLabel} <ArrowUpRight size={13} />
          </Link>
        )}
      </div>
      {empty ? (
        <p className="px-5 py-10 text-center text-sm text-gray-400">{empty}</p>
      ) : (
        <div className="divide-y divide-gray-50">{children}</div>
      )}
    </div>
  );
}

export default function AdminVisaDashboardPage() {
  const { admin } = useAdminAuth();

  const [leadsQ, appsQ, blogsQ] = useQueries({
    queries: [
      {
        queryKey: ['dashboard-visa', 'leads'],
        queryFn: () => getAdminVisaLeadsApi({ page: 1, limit: 6 }),
      },
      {
        queryKey: ['dashboard-visa', 'applications'],
        queryFn: () => adminListApplicationsApi({ page: 1, limit: 6 }),
      },
      {
        queryKey: ['dashboard-visa', 'blogs'],
        queryFn: () => getAllBlogsApi({ page: 1, limit: 1 }),
      },
    ],
  });

  const leads = leadsQ.data?.leads ?? leadsQ.data?.data ?? [];
  const apps = appsQ.data?.applications ?? appsQ.data?.data ?? [];
  const leadTotal = leadsQ.data?.pagination?.total ?? leads.length;
  const appTotal = appsQ.data?.pagination?.total ?? apps.length;
  const blogTotal = blogsQ.data?.pagination?.total ?? 0;
  const newLeads = leads.filter((l) => l.status === 'new').length;

  const failed = leadsQ.isError || appsQ.isError;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">
          {admin?.name ? `Welcome back, ${admin.name.split(' ')[0]}` : 'Dashboard'}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Visa leads and applications at a glance
        </p>
      </div>

      {failed && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          Some dashboard data could not be loaded. Refresh to try again.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Inbox}
          iconColor="text-primary-700"
          iconBg="bg-primary-50"
          label="Visa Leads"
          value={leadsQ.isLoading ? '—' : leadTotal}
          sub={newLeads > 0 ? `${newLeads} new and unactioned` : 'No new leads'}
        />
        <StatCard
          icon={ClipboardList}
          iconColor="text-primary-700"
          iconBg="bg-primary-50"
          label="Visa Applications"
          value={appsQ.isLoading ? '—' : appTotal}
          sub="Across every status"
        />
        <StatCard
          icon={BookOpen}
          iconColor="text-primary-700"
          iconBg="bg-primary-50"
          label="Blog Posts"
          value={blogsQ.isLoading ? '—' : blogTotal}
          sub="Published and draft"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <SectionCard
          title="Latest Leads"
          href="/admin/visa-leads"
          linkLabel="All leads"
          empty={!leadsQ.isLoading && leads.length === 0 ? 'No leads yet.' : null}
        >
          {leads.map((lead) => (
            <div key={lead._id} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/visa-leads/${lead._id}`}
                  className="block truncate font-semibold text-gray-900 hover:text-primary-700 hover:underline transition-colors"
                >
                  {leadName(lead)}
                </Link>
                <p className="mt-0.5 truncate text-xs text-gray-400">
                  {lead.visaCountryName || lead.visaSlug || 'Destination not set'}
                </p>
              </div>
              <StatusPill status={lead.status} />
              <span className="w-16 shrink-0 text-right text-xs text-gray-400">
                {timeAgo(lead.createdAt)}
              </span>
            </div>
          ))}
        </SectionCard>

        <SectionCard
          title="Recent Applications"
          href="/admin/visa-applications"
          linkLabel="All applications"
          empty={!appsQ.isLoading && apps.length === 0 ? 'No applications yet.' : null}
        >
          {apps.map((app) => (
            <div key={app._id} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/visa-applications/${app._id}`}
                  className="block truncate font-mono text-[13px] font-bold text-primary-700 hover:underline"
                >
                  {app.applicationRef || '—'}
                </Link>
                <p className="mt-0.5 truncate text-xs text-gray-400">
                  {app.destination || app.visaCountryName || 'Destination not set'}
                </p>
              </div>
              <StatusPill status={app.status} />
              <span className="w-16 shrink-0 text-right text-xs text-gray-400">
                {timeAgo(app.createdAt)}
              </span>
            </div>
          ))}
        </SectionCard>
      </div>
    </div>
  );
}
