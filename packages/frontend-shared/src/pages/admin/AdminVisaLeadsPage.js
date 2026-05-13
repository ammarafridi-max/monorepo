'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, X, Loader2, Inbox, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useGetAdminVisaLeads } from '../../hooks/visa-leads/useGetAdminVisaLeads.js';
import { useGetAdminVisas }     from '../../hooks/visa/useGetAdminVisas.js';
import { useGetAdminUsers }     from '../../hooks/admin-users/useGetAdminUsers.js';

const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];

const STATUS_CFG = {
  new:       { label: 'New',       cls: 'bg-blue-50   text-blue-700   border-blue-200',   dot: 'bg-blue-500'   },
  contacted: { label: 'Contacted', cls: 'bg-amber-50  text-amber-700  border-amber-200',  dot: 'bg-amber-500'  },
  qualified: { label: 'Qualified', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  converted: { label: 'Converted', cls: 'bg-green-50  text-green-700  border-green-200',  dot: 'bg-green-500'  },
  lost:      { label: 'Lost',      cls: 'bg-gray-100  text-gray-500   border-gray-200',   dot: 'bg-gray-400'   },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.contacted;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function timeAgo(iso) {
  if (!iso) return '—';
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60)  return 'just now';
  if (secs < 3600) {
    const m = Math.floor(secs / 60);
    return `${m} minute${m !== 1 ? 's' : ''} ago`;
  }
  if (secs < 86400) {
    const h = Math.floor(secs / 3600);
    return `${h} hour${h !== 1 ? 's' : ''} ago`;
  }
  const d = Math.floor(secs / 86400);
  if (d < 7)   return `${d} day${d !== 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const selectCls =
  'border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-full';

function Filters({ filters, setFilters, visas = [], adminUsers = [] }) {
  function set(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

  return (
    <>
      <select
        value={filters.status || 'all'}
        onChange={(e) => set('status', e.target.value)}
        className={`${selectCls} max-w-[140px]`}
      >
        <option value="all">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{STATUS_CFG[s]?.label ?? s}</option>
        ))}
      </select>

      <select
        value={filters.visaSlug || 'all'}
        onChange={(e) => set('visaSlug', e.target.value)}
        className={`${selectCls} max-w-[160px]`}
      >
        <option value="all">All visas</option>
        {visas.map((v) => (
          <option key={v._id} value={v.slug}>{v.countryName}</option>
        ))}
      </select>

      <select
        value={filters.assignedTo || 'all'}
        onChange={(e) => set('assignedTo', e.target.value)}
        className={`${selectCls} max-w-[160px]`}
      >
        <option value="all">All assignees</option>
        <option value="unassigned">Unassigned</option>
        {(Array.isArray(adminUsers) ? adminUsers : []).map((u) => (
          <option key={u._id} value={u._id}>{u.name || u.email}</option>
        ))}
      </select>

      <input
        type="date"
        value={filters.dateFrom || ''}
        onChange={(e) => set('dateFrom', e.target.value)}
        className={`${selectCls} max-w-[150px]`}
        placeholder="From date"
      />

      <input
        type="date"
        value={filters.dateTo || ''}
        onChange={(e) => set('dateTo', e.target.value)}
        className={`${selectCls} max-w-[150px]`}
        placeholder="To date"
      />
    </>
  );
}

const DEFAULT_FILTERS = {
  page: 1, limit: 25, status: 'all', visaSlug: 'all',
  nationality: '', assignedTo: 'all', dateFrom: '', dateTo: '', search: '',
};

export default function AdminVisaLeadsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const { leads, pagination, isLoadingLeads } = useGetAdminVisaLeads({
    page:       filters.page,
    limit:      filters.limit,
    status:     filters.status !== 'all' ? filters.status : undefined,
    visaSlug:   filters.visaSlug !== 'all' ? filters.visaSlug : undefined,
    nationality: filters.nationality || undefined,
    assignedTo: filters.assignedTo !== 'all' ? filters.assignedTo : undefined,
    dateFrom:   filters.dateFrom || undefined,
    dateTo:     filters.dateTo   || undefined,
    search:     filters.search.trim() || undefined,
  });

  const { visas = [] } = useGetAdminVisas({ limit: 100 });
  const { users: adminUsers } = useGetAdminUsers({ limit: 100 });

  const totalPages = pagination?.totalPages ?? 1;
  const total      = pagination?.total      ?? 0;

  function handleRowClick(id) {
    router.push(`/admin/visa-leads/${id}`);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Visa Leads</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isLoadingLeads
              ? 'Loading…'
              : `${total} lead${total !== 1 ? 's' : ''} · auto-refreshes every 30 s`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, email, phone…"
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))}
            className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((p) => ({ ...p, search: '', page: 1 }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <Filters
          filters={filters}
          setFilters={setFilters}
          visas={Array.isArray(visas) ? visas : []}
          adminUsers={Array.isArray(adminUsers) ? adminUsers : []}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

        {isLoadingLeads ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Inbox size={22} className="text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-600">No leads found</p>
            <p className="text-xs text-gray-400 mt-1">
              Leads from your visa pages will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Name', 'Nationality', 'Visa', 'Package', 'Status', 'Assigned to', 'Submitted', ''].map((h, i) => (
                    <th key={i} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map((lead) => {
                  const isNew = lead.status === 'new';
                  return (
                    <tr
                      key={lead._id}
                      onClick={() => handleRowClick(lead._id)}
                      className={`hover:bg-gray-50/60 transition-colors cursor-pointer group ${
                        isNew ? 'border-l-2 border-l-accent-500' : ''
                      }`}
                    >

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 whitespace-nowrap">
                            {lead.firstName} {lead.lastName}
                          </p>
                          {isNew && (
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-accent-500 text-white px-1.5 py-0.5 rounded-full shrink-0">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{lead.email}</p>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {lead.nationality || '—'}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {lead.visaCountryName || lead.visaSlug || '—'}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate">
                        {lead.packageRequested === 'undecided' ? (
                          <span className="italic text-gray-400">Undecided</span>
                        ) : (
                          lead.packageRequested || '—'
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={lead.status} />
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {lead.assignedTo?.name || (
                          <span className="text-gray-300">Unassigned</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {timeAgo(lead.createdAt)}
                      </td>

                      <td className="px-4 py-3 text-gray-300 group-hover:text-gray-500 transition-colors">
                        <ChevronRight size={14} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Page {filters.page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button
                disabled={filters.page === 1}
                onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={filters.page === totalPages}
                onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
