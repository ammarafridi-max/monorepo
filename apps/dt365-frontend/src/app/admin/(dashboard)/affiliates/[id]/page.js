'use client';

import { Suspense, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, AlertCircle, Pencil, Trash2, X,
  Handshake, BarChart2, Ticket, Mail, Hash,
  ChevronLeft, ChevronRight, ExternalLink,
} from 'lucide-react';
import { useGetAffiliate }        from '@travel-suite/frontend-shared/hooks/affiliates/useGetAffiliate';
import { useGetAffiliateStats }   from '@travel-suite/frontend-shared/hooks/affiliates/useGetAffiliateStats';
import { useGetAffiliateTickets } from '@travel-suite/frontend-shared/hooks/affiliates/useGetAffiliateTickets';
import { useUpdateAffiliate }  from '@travel-suite/frontend-shared/hooks/affiliates/useUpdateAffiliate';
import { useDeleteAffiliate }  from '@travel-suite/frontend-shared/hooks/affiliates/useDeleteAffiliate';

/* --- Helpers ----------------------------------------------------------------- */

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDatetime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtAmount(val, currency = 'AED') {
  if (val == null) return '—';
  return `${currency} ${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statAmount(value, fallbackCurrency = 'AED') {
  if (value == null) return '—';
  if (typeof value === 'object') return fmtAmount(value.amount, value.currency || fallbackCurrency);
  return fmtAmount(value, fallbackCurrency);
}

/* --- UI primitives ----------------------------------------------------------- */

function Card({ title, icon: Icon, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
        {Icon && <Icon size={14} className="text-gray-400 shrink-0" />}
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className={`text-xs font-semibold text-gray-800 text-right break-all ${mono ? 'font-mono' : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

function StatPill({ label, value, sub }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900">{value ?? '—'}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

/* --- Toggle ------------------------------------------------------------------- */

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
        checked ? 'bg-green-500' : 'bg-gray-200'
      }`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

/* --- Edit modal -------------------------------------------------------------- */

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 transition disabled:bg-gray-50 disabled:text-gray-400';

function EditModal({ affiliate, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    name: affiliate.name ?? '',
    commissionPercent: String(affiliate.commissionPercent ?? ''),
    isActive: affiliate.isActive ?? true,
  });

  function set(key, val) { setForm((p) => ({ ...p, [key]: val })); }

  const canSave = form.name.trim() && form.commissionPercent !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-bold text-gray-900">Edit Affiliate</p>
            <p className="text-[11px] text-gray-400 mt-0.5 font-mono">ID: {affiliate.affiliateId}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
            <input type="email" value={affiliate.email} disabled className={inputCls} />
            <p className="text-[11px] text-gray-400 mt-1">Email cannot be changed after creation.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Commission % <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type="number" value={form.commissionPercent} onChange={(e) => set('commissionPercent', e.target.value)} min="0" max="100" step="0.5" className={`${inputCls} pr-8`} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">%</span>
            </div>
          </div>
          <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition">
            <div>
              <p className="text-xs font-semibold text-gray-700">Active</p>
              <p className="text-[11px] text-gray-400">Inactive affiliates cannot earn commissions.</p>
            </div>
            <Toggle checked={form.isActive} onChange={() => set('isActive', !form.isActive)} />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition">Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={!canSave || saving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white rounded-xl transition"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Delete section ----------------------------------------------------------- */

function DeleteSection({ id }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const { deleteAffiliate, isDeletingAffiliate } = useDeleteAffiliate();

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition"
      >
        <Trash2 size={13} /> Delete Affiliate
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
      <p className="text-xs font-semibold text-red-700">
        This permanently deletes the affiliate and all associated data. This cannot be undone.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => deleteAffiliate(id, { onSuccess: () => router.push('/admin/affiliates') })}
          disabled={isDeletingAffiliate}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-60"
        >
          {isDeletingAffiliate && <Loader2 size={11} className="animate-spin" />}
          Confirm Delete
        </button>
        <button onClick={() => setConfirm(false)} className="flex-1 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition">
          Cancel
        </button>
      </div>
    </div>
  );
}

/* --- Tickets table ------------------------------------------------------------ */

function TicketsTable({ affiliateId, commissionPercent }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Number(searchParams.get('ticketPage') || 1);
  const { tickets, pagination, isLoadingAffiliateTickets } = useGetAffiliateTickets(affiliateId, { page, limit: 10 });
  const totalPages = pagination?.totalPages ?? 1;

  function goToPage(p) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('ticketPage', String(p));
    router.push(`?${params.toString()}`);
  }

  if (isLoadingAffiliateTickets) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 size={20} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
        <Ticket size={20} className="text-gray-300" />
        <p className="text-xs text-gray-400">No tickets yet for this affiliate.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto -mx-5">
        <table className="w-full text-xs min-w-[560px]">
          <thead>
            <tr className="bg-gray-50/60">
              {['Session', 'Journey', 'Amount', 'Commission', 'Status', 'Date'].map((h, i) => (
                <th key={i} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide px-5 py-2.5 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tickets.map((t, i) => (
              <tr key={t._id ?? i} className="hover:bg-gray-50/40">
                <td className="px-5 py-2.5 font-mono text-gray-500 whitespace-nowrap">
                  <Link href={`/admin/applications/${t.sessionId}`} className="hover:text-primary-700 hover:underline flex items-center gap-1">
                    {t.sessionId ? t.sessionId.slice(0, 8) + '…' : '—'}
                    <ExternalLink size={10} />
                  </Link>
                </td>
                <td className="px-5 py-2.5 text-gray-600 capitalize">{t.journeyType ?? '—'}</td>
                <td className="px-5 py-2.5 font-semibold text-gray-800">{fmtAmount(t.amountPaid?.amount, t.amountPaid?.currency)}</td>
                <td className="px-5 py-2.5 font-semibold text-green-700">{fmtAmount(((Number(t.amountPaid?.amount || 0) * Number(commissionPercent || 0)) / 100), t.amountPaid?.currency)}</td>
                <td className="px-5 py-2.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    t.paymentStatus === 'PAID'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {t.paymentStatus ?? '—'}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-gray-400 whitespace-nowrap">{fmtDate(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
          <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
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
  );
}

/* --- Content (needs Suspense for useSearchParams in TicketsTable) ------------- */

function AffiliateDetailContent() {
  const { id } = useParams();
  const [editOpen, setEditOpen] = useState(false);

  const { affiliate, isLoadingAffiliate, isErrorAffiliate } = useGetAffiliate(id);
  const { stats, isLoadingStats }                            = useGetAffiliateStats(id);
  const { updateAffiliate, isUpdatingAffiliate }             = useUpdateAffiliate();

  /* -- Loading -- */
  if (isLoadingAffiliate) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-medium">Loading affiliate…</p>
        </div>
      </div>
    );
  }

  /* -- Error -- */
  if (isErrorAffiliate || !affiliate) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">Affiliate not found</p>
            <p className="text-xs text-gray-400 mt-1">This affiliate may have been deleted.</p>
          </div>
          <Link href="/admin/affiliates" className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline">
            <ArrowLeft size={13} /> Back to affiliates
          </Link>
        </div>
      </div>
    );
  }

  function handleSave(form) {
    updateAffiliate(
      { id: affiliate._id, payload: { name: form.name.trim(), commissionPercent: Number(form.commissionPercent), isActive: form.isActive } },
      { onSuccess: () => setEditOpen(false) },
    );
  }

  return (
    <>
      {editOpen && (
        <EditModal
          affiliate={affiliate}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
          saving={isUpdatingAffiliate}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-5">

        {/* -- Header -- */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/affiliates"
              className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-accent-700">
                  {affiliate.name?.charAt(0).toUpperCase() ?? '?'}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-extrabold text-gray-900">{affiliate.name}</h2>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    affiliate.isActive
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    {affiliate.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{affiliate.email}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 border border-gray-200 hover:border-primary-300 hover:text-primary-700 text-gray-600 rounded-xl transition"
          >
            <Pencil size={13} /> Edit
          </button>
        </div>

        {/* -- Stats -- */}
        {!isLoadingStats && stats && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatPill
              label="Total Tickets"
              value={stats.totalTickets?.toLocaleString() ?? '0'}
              sub="All time"
            />
            <StatPill
              label="Paid Tickets"
              value={stats.paidTickets?.toLocaleString() ?? '0'}
              sub="Payment confirmed"
            />
            <StatPill
              label="Commission Earned"
              value={statAmount(stats.totalCommission)}
              sub={`${affiliate.commissionPercent}% rate`}
            />
            <StatPill
              label="Total Revenue"
              value={statAmount(stats.paidRevenue ?? stats.totalRevenue)}
              sub="From paid tickets"
            />
          </div>
        )}

        {/* -- Two-column body -- */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-5 items-start">

          {/* Tickets */}
          <Card title="Tickets" icon={Ticket}>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-gray-300" /></div>}>
              <TicketsTable affiliateId={affiliate._id} commissionPercent={affiliate.commissionPercent} />
            </Suspense>
          </Card>

          {/* Sidebar */}
          <div className="space-y-4 xl:sticky xl:top-6">

            <Card title="Affiliate Info" icon={Handshake}>
              <InfoRow label="Name"       value={affiliate.name} />
              <InfoRow label="Email"      value={affiliate.email} />
              <InfoRow label="ID"         value={affiliate.affiliateId} mono />
              <InfoRow label="Commission" value={`${affiliate.commissionPercent}%`} />
              <InfoRow label="Status"     value={affiliate.isActive ? 'Active' : 'Inactive'} />
              <InfoRow label="Created"    value={fmtDatetime(affiliate.createdAt)} />
              <InfoRow label="Updated"    value={fmtDatetime(affiliate.updatedAt)} />
            </Card>

            <Card title="Contact" icon={Mail}>
              <p className="text-sm font-semibold text-gray-800 break-all">{affiliate.email}</p>
            </Card>

            <Card title="Stats" icon={BarChart2}>
              <InfoRow label="Commission rate" value={`${affiliate.commissionPercent}%`} />
              {!isLoadingStats && stats && (
                <>
                  <InfoRow label="Total tickets"  value={stats.totalTickets ?? 0} />
                  <InfoRow label="Paid tickets"   value={stats.paidTickets ?? 0} />
                  <InfoRow label="Pending tickets" value={stats.pendingApplications ?? 0} />
                  <InfoRow label="Total revenue"  value={statAmount(stats.paidRevenue ?? stats.totalRevenue)} />
                  <InfoRow label="Commission"     value={statAmount(stats.totalCommission)} />
                </>
              )}
            </Card>

            {/* Danger zone */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Danger Zone</p>
              </div>
              <div className="p-5">
                <DeleteSection id={affiliate._id} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

/* --- Page --------------------------------------------------------------------- */

export default function AffiliateDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    }>
      <AffiliateDetailContent />
    </Suspense>
  );
}
