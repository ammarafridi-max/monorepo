'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ClipboardList, ChevronLeft, ChevronRight, Loader2, ArrowUpRight,
  Plus, Search, X, AlertTriangle, Bell, BellOff, Clock,
} from 'lucide-react';
import { useAdminApplications } from '../../hooks/visa-applications/useAdminApplications.js';
import { useCreateApplication, useToggleReminders } from '../../hooks/visa-applications/useVisaAppMutations.js';

const STATUS_CFG = {
  DRAFT: { dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  INFO_PENDING: { dot: 'bg-amber-400', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  INFO_COMPLETE: { dot: 'bg-amber-400', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  DOCS_READY: { dot: 'bg-blue-400', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  APPOINTMENT_BOOKED: { dot: 'bg-indigo-400', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  SUBMITTED: { dot: 'bg-indigo-400', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  DELIVERED: { dot: 'bg-teal-400', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  APPROVED: { dot: 'bg-green-500', cls: 'bg-green-50 text-green-700 border-green-200' },
  REJECTED: { dot: 'bg-red-500', cls: 'bg-red-50 text-red-700 border-red-200' },
  CANCELLED: { dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-400 border-gray-200' },
};

// Work-queue filter chips → the backend `queue` param.
const QUEUES = [
  { key: 'needs_review', label: 'Needs review' },
  { key: 'your_turn', label: 'Your turn' },
  { key: 'gone_quiet', label: 'Gone quiet' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'rejected_pending', label: 'Rejected pending fix' },
  { key: 'ready_to_submit', label: 'Ready to submit' },
  { key: 'all', label: 'All' },
];

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? { dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {String(status || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
    </span>
  );
}

function customerName(app) {
  if (!app.user) return '—';
  const name = `${app.user.firstName || ''} ${app.user.lastName || ''}`.trim();
  return name || app.user.email || '—';
}

function CreateModal({ onClose }) {
  const router = useRouter();
  const { mutate, isPending } = useCreateApplication();
  const [form, setForm] = useState({ email: '', destinationCountry: 'Schengen', packageName: '', applicantCount: 1 });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500';

  function submit(e) {
    e.preventDefault();
    if (!form.email.trim()) return;
    mutate({ ...form, applicantCount: Number(form.applicantCount) || 1 }, {
      onSuccess: (res) => { onClose(); if (res?.application?._id) router.push(`/admin/visa-applications/${res.application._id}`); },
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">New application</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition"><X size={18} /></button>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Customer email</label>
          <input type="email" required value={form.email} onChange={set('email')} placeholder="customer@email.com" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Destination</label>
            <input value={form.destinationCountry} onChange={set('destinationCountry')} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Applicants</label>
            <input type="number" min={1} max={20} value={form.applicantCount} onChange={set('applicantCount')} className={inputCls} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Package (optional)</label>
          <input value={form.packageName} onChange={set('packageName')} className={inputCls} />
        </div>
        <button type="submit" disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition disabled:opacity-60">
          {isPending ? <Loader2 size={14} className="animate-spin" /> : 'Create & email customer'}
        </button>
      </form>
    </div>
  );
}

// Days-quiet cell — reddens as silence grows.
function QuietCell({ days }) {
  if (days == null) return <span className="text-gray-300">—</span>;
  const tone = days >= 5 ? 'text-red-600 font-bold' : days >= 3 ? 'text-amber-600 font-semibold' : 'text-gray-500';
  return <span className={`inline-flex items-center gap-1 ${tone}`}><Clock size={12} /> {days}d</span>;
}

function ReminderToggle({ app }) {
  const { mutate, isPending } = useToggleReminders();
  const paused = app.reminderState === 'PAUSED';
  const escalated = app.reminderState === 'ESCALATED';
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={(e) => { e.preventDefault(); mutate({ id: app._id, reminderState: paused ? 'ACTIVE' : 'PAUSED' }); }}
      title={paused ? 'Reminders paused — click to resume' : escalated ? 'Escalated — click to pause' : 'Reminders active — click to pause'}
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition disabled:opacity-50
        ${paused ? 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
          : escalated ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
          : 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100'}`}
    >
      {isPending ? <Loader2 size={11} className="animate-spin" /> : paused ? <BellOff size={11} /> : <Bell size={11} />}
      {paused ? 'Paused' : escalated ? 'Escalated' : `${app.reminderCount || 0}`}
    </button>
  );
}

function ApplicationsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get('page') || 1);
  const urlSearch = searchParams.get('search') ?? '';
  const urlQueue = searchParams.get('queue') || 'all';

  const { applications, summary, pagination, isLoading } = useAdminApplications({
    page, search: urlSearch || undefined, queue: urlQueue,
  });
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;

  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [creating, setCreating] = useState(false);
  useEffect(() => setLocalSearch(urlSearch), [urlSearch]);

  function pushParams(p) { p.delete('page'); router.push(`${pathname}?${p.toString()}`); }
  function setQueue(key) {
    const p = new URLSearchParams(searchParams.toString());
    if (key && key !== 'all') p.set('queue', key); else p.delete('queue');
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

  function summaryCard(label, value, sub, accent = 'text-gray-900') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4">
        <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
        <p className={`text-lg sm:text-2xl font-extrabold ${accent}`}>{value}</p>
        {sub && <p className="hidden sm:block text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Visa Applications</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isLoading ? 'Loading…' : `${total} in this queue · oldest silence first`}
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-colors shrink-0"
        >
          <Plus size={14} /> New application
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        {summaryCard('Total Applications', String(summary?.total ?? 0), 'Across all statuses')}
        {summaryCard('Under Review', String(summary?.underReview ?? 0), 'Documents complete', 'text-blue-700')}
        {summaryCard('Approved', String(summary?.approved ?? 0), 'Fully approved', 'text-green-700')}
        {summaryCard('Escalated', String(summary?.escalated ?? 0), 'Gone quiet, need a call', 'text-red-700')}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {QUEUES.map((q) => {
          const active = urlQueue === q.key || (q.key === 'all' && (!urlQueue || urlQueue === 'all'));
          return (
            <button
              key={q.key}
              onClick={() => setQueue(q.key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition
                ${active ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-700'}`}
            >
              {q.label}
            </button>
          );
        })}
      </div>

      <div className="w-full sm:max-w-sm">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by ref or destination..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={22} className="animate-spin text-gray-300" /></div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center"><ClipboardList size={22} className="text-gray-400" /></div>
            <div>
              <p className="text-sm font-bold text-gray-600">Nothing in this queue</p>
              <p className="text-xs text-gray-400 mt-1">Try a different filter above.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[960px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['Ref', 'Customer', 'Destination', 'Status', 'Assignee', 'Completeness', urlQueue === 'your_turn' ? 'Waiting' : 'Quiet', 'Reminders', ''].map((h, i) => (
                      <th key={i} className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {applications.map((app) => (
                    <tr key={app._id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/admin/visa-applications/${app._id}`} className="font-mono text-[12px] font-bold text-primary-700 hover:underline">{app.applicationRef}</Link>
                          {app.hasRejected && (
                            <span title="A document is rejected and awaiting a fix" className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-full px-1.5 py-0.5">
                              <AlertTriangle size={10} /> Rejected
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 max-w-[180px] truncate">{customerName(app)}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{app.destinationCountry}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={app.status} /></td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{app.assignedTo?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-primary-500" style={{ width: `${app.completeness ?? 0}%` }} /></div>
                          <span className="text-[11px] text-gray-500">{app.completeness ?? 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[12px]"><QuietCell days={urlQueue === 'your_turn' ? app.daysSinceCustomerCompleted : app.daysQuiet} /></td>
                      <td className="px-4 py-3 whitespace-nowrap"><ReminderToggle app={app} /></td>
                      <td className="px-4 py-3 w-16">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/visa-applications/${app._id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition" title="View details">
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
                <p className="text-sm text-gray-400">Page {page} of {totalPages} · {total} total</p>
                <div className="flex items-center gap-2">
                  <button disabled={page === 1} onClick={() => goToPage(page - 1)} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition"><ChevronLeft size={14} /></button>
                  <button disabled={page === totalPages} onClick={() => goToPage(page + 1)} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition"><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {creating && <CreateModal onClose={() => setCreating(false)} />}
    </div>
  );
}

export default function AdminApplicationsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={24} className="animate-spin text-gray-300" /></div>}>
      <ApplicationsContent />
    </Suspense>
  );
}
