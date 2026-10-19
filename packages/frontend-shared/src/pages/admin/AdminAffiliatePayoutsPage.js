'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Wallet,
  Loader2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Play,
  CheckCircle2,
  Ban,
  Eye,
  ArrowLeft,
  AlertTriangle,
  Activity,
  Lock,
} from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useGetAffiliatePayouts } from '../../hooks/affiliates/useGetAffiliatePayouts';
import { useGetAffiliatePayout } from '../../hooks/affiliates/useGetAffiliatePayout';
import { useGenerateAffiliatePayouts } from '../../hooks/affiliates/useGenerateAffiliatePayouts';
import { useMarkAffiliatePayoutPaid } from '../../hooks/affiliates/useMarkAffiliatePayoutPaid';
import { useVoidAffiliatePayout } from '../../hooks/affiliates/useVoidAffiliatePayout';

const STATUS_CFG = {
  PENDING: { label: 'Pending', dot: 'bg-amber-400', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  PAID: { label: 'Paid', dot: 'bg-green-500', cls: 'bg-green-50 text-green-700 border-green-200' },
  VOID: { label: 'Void', dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'VOID', label: 'Void' },
];

const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 transition disabled:bg-gray-50 disabled:text-gray-400';

const selectCls =
  'px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white';

function lastCompleteMonth() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDatetime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtMoney(value, currency) {
  if (value == null) return '—';
  const formatted = Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency ? `${currency} ${formatted}` : formatted;
}

function periodLabel(payout) {
  if (!payout?.periodStart) return '—';
  return new Date(payout.periodStart).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

function affiliateName(payout) {
  if (typeof payout?.affiliate === 'object' && payout.affiliate?.name) return payout.affiliate.name;
  return 'Affiliate';
}

function affiliateEmail(payout) {
  if (typeof payout?.affiliate === 'object' && payout.affiliate?.email) return payout.affiliate.email;
  return null;
}

function affiliateLinkId(payout) {
  if (typeof payout?.affiliate === 'object' && payout.affiliate?._id) return payout.affiliate._id;
  if (typeof payout?.affiliate === 'string') return payout.affiliate;
  return null;
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? { label: status ?? '—', dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function AmountStateBadge({ status }) {
  if (status === 'PAID') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-gray-100 text-gray-600 border-gray-200">
        <Lock size={9} /> Frozen
      </span>
    );
  }
  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
        <Activity size={9} /> Live
      </span>
    );
  }
  return null;
}

function CurrencyNote({ currency }) {
  if (currency) return null;
  return <p className="text-[10px] text-amber-600 font-semibold mt-0.5">No base currency set</p>;
}

function StatCard({ label, value, sub, accent = 'text-gray-900' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4">
      <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-lg sm:text-2xl font-extrabold ${accent}`}>{value}</p>
      {sub && <p className="hidden sm:block text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function StatSkeletons() {
  return Array.from({ length: 4 }).map((_, index) => (
    <div key={index} className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 animate-pulse">
      <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
      <div className="h-8 w-16 bg-gray-100 rounded mb-2" />
      <div className="hidden sm:block h-3 w-28 bg-gray-100 rounded" />
    </div>
  ));
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

function GenerateModal({ onClose, onRun, running, run, onReset }) {
  const [period, setPeriod] = useState(lastCompleteMonth());
  const valid = PERIOD_PATTERN.test(period) && period <= lastCompleteMonth();
  const claimed = run?.payouts?.filter((p) => p.claimed) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-bold text-gray-900">Run a payout month</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Claims every unclaimed commissionable order in the month into a pending payout.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Period <span className="text-red-500">*</span>
            </label>
            <input
              type="month"
              value={period}
              max={lastCompleteMonth()}
              onChange={(e) => {
                setPeriod(e.target.value);
                onReset();
              }}
              className={inputCls}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              A future month is rejected. Re-running a month is safe, it reports the period and claims nothing twice.
            </p>
          </div>

          {run && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {run.period} · {run.payouts?.length ?? 0} payout{run.payouts?.length === 1 ? '' : 's'} · {claimed.length} newly claimed
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Window {fmtDate(run.periodStart)} → {fmtDate(run.periodEnd)}
                  {run.holdDays != null ? ` · ${run.holdDays} day hold` : ''}
                </p>
              </div>
              <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                {(run.payouts ?? []).map((p) => (
                  <div key={p.payoutId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 font-mono">{p.affiliateId}</p>
                      <p className="text-[11px] text-gray-400">
                        {p.orderCount} order{p.orderCount === 1 ? '' : 's'}
                        {p.absorbedRefundAmount ? ` · ${fmtMoney(p.absorbedRefundAmount, p.currency)} absorbed` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-gray-900">{fmtMoney(p.commissionAmount, p.currency)}</span>
                      <StatusBadge status={p.status} />
                      {!p.claimed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-gray-100 text-gray-500 border-gray-200">
                          Existing
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {(run.payouts ?? []).length === 0 && (
                  <p className="px-4 py-6 text-center text-xs text-gray-400">Nothing commissionable in this month.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition">
            Close
          </button>
          <button
            onClick={() => onRun(period)}
            disabled={!valid || running}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-primary-700 hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition"
          >
            {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            {run ? 'Run again' : 'Run month'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MarkPaidModal({ payout, onClose, onConfirm, saving }) {
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const canSave = reference.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-bold text-gray-900">Record this payout as paid</p>
            <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{payout.affiliateId} · {periodLabel(payout)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <AlertTriangle size={13} /> This cannot be undone
            </p>
            <p className="text-[11px] text-amber-800 mt-1">
              Marking paid freezes the amounts as a record of money sent. The payout can no longer be voided and the
              figures stop recalculating.
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-1">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Amount to send</p>
            <p className="text-2xl font-extrabold text-gray-900">{fmtMoney(payout.commissionAmount, payout.currency)}</p>
            <CurrencyNote currency={payout.currency} />
            <p className="text-[11px] text-gray-400">
              {payout.orderCount} order{payout.orderCount === 1 ? '' : 's'} · live figure until you confirm
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Payment reference <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Bank transfer ID, cheque number, wallet transaction"
              className={inputCls}
            />
            <p className="text-[11px] text-gray-400 mt-1">This is the audit trail for the transfer. Keep it exact.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Anything a future reviewer needs to know"
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition">
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ reference: reference.trim(), note: note.trim() })}
            disabled={!canSave || saving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Confirm payment sent
          </button>
        </div>
      </div>
    </div>
  );
}

function VoidModal({ payout, onClose, onConfirm, saving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">Void this payout</p>
          <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{payout.affiliateId} · {periodLabel(payout)}</p>
        </div>
        <div className="px-6 py-5">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-xs font-semibold text-red-700">
              Voiding cancels the payout without paying it. The claimed orders stay claimed, so they will not reappear in
              a later month.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl transition"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
            Void payout
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ id, onClose }) {
  const { payout, isLoadingPayout, isErrorPayout } = useGetAffiliatePayout(id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">Payout detail</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
            <X size={15} />
          </button>
        </div>

        {isLoadingPayout ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : isErrorPayout || !payout ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <AlertTriangle size={20} className="text-red-400" />
            <p className="text-sm font-bold text-gray-700">Payout not found</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-base font-extrabold text-gray-900">{affiliateName(payout)}</p>
                {affiliateEmail(payout) && <p className="text-xs text-gray-400">{affiliateEmail(payout)}</p>}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={payout.status} />
                <AmountStateBadge status={payout.status} />
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Commission</p>
              <p className="text-2xl font-extrabold text-gray-900">{fmtMoney(payout.commissionAmount, payout.currency)}</p>
              <CurrencyNote currency={payout.currency} />
              <p className="text-[11px] text-gray-400 mt-1">
                {payout.status === 'PAID'
                  ? 'Frozen record of what was sent.'
                  : 'Live estimate, recalculated on every read and reduced by any refund.'}
              </p>
            </div>

            {payout.absorbedRefundAmount > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-bold text-amber-900">
                  {fmtMoney(payout.absorbedRefundAmount, payout.currency)} absorbed
                </p>
                <p className="text-[11px] text-amber-800 mt-1">
                  Commission on {payout.absorbedRefundCount ?? 0} refunded order
                  {payout.absorbedRefundCount === 1 ? '' : 's'} that the business absorbed. It is not clawed back and it
                  is not deducted from the figure above.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 p-4">
              <InfoRow label="Affiliate ID" value={payout.affiliateId} mono />
              {typeof payout.affiliate === 'object' && payout.affiliate?.commissionPercent != null && (
                <InfoRow label="Commission rate" value={`${payout.affiliate.commissionPercent}%`} />
              )}
              {typeof payout.affiliate === 'object' && payout.affiliate?.isActive != null && (
                <InfoRow label="Affiliate status" value={payout.affiliate.isActive ? 'Active' : 'Inactive'} />
              )}
              <InfoRow label="Period" value={`${fmtDate(payout.periodStart)} → ${fmtDate(payout.periodEnd)}`} />
              <InfoRow label="Orders" value={payout.orderCount ?? 0} />
              <InfoRow label="Revenue" value={fmtMoney(payout.revenueAmount, payout.currency)} />
              <InfoRow label="Currency" value={payout.currency ?? 'Not set'} />
              <InfoRow label="Paid at" value={payout.paidAt ? fmtDatetime(payout.paidAt) : '—'} />
              <InfoRow label="Reference" value={payout.reference || '—'} mono />
              <InfoRow label="Note" value={payout.note || '—'} />
              <InfoRow label="Created" value={fmtDatetime(payout.createdAt)} />
              <InfoRow label="Updated" value={fmtDatetime(payout.updatedAt)} />
            </div>

            {affiliateLinkId(payout) && (
              <Link
                href={`/admin/affiliates/${affiliateLinkId(payout)}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline"
              >
                Open affiliate <ChevronRight size={13} />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PayoutsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { adminUser, isLoadingAdminAuth } = useAdminAuth();
  const canManage = !isLoadingAdminAuth && adminUser?.role === 'admin';

  const page = Number(searchParams.get('page') || 1);
  const urlStatus = searchParams.get('status') || '';
  const urlPeriod = searchParams.get('period') || '';
  const urlAffiliateId = searchParams.get('affiliateId') || '';

  const [localStatus, setLocalStatus] = useState(urlStatus);
  const [localPeriod, setLocalPeriod] = useState(urlPeriod);
  const [localAffiliateId, setLocalAffiliateId] = useState(urlAffiliateId);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [payingPayout, setPayingPayout] = useState(null);
  const [voidingTarget, setVoidingTarget] = useState(null);

  useEffect(() => setLocalStatus(urlStatus), [urlStatus]);
  useEffect(() => setLocalPeriod(urlPeriod), [urlPeriod]);
  useEffect(() => setLocalAffiliateId(urlAffiliateId), [urlAffiliateId]);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 20,
      ...(urlStatus && { status: urlStatus }),
      ...(PERIOD_PATTERN.test(urlPeriod) && { period: urlPeriod }),
      ...(/^\d{9}$/.test(urlAffiliateId) && { affiliateId: urlAffiliateId }),
    }),
    [page, urlStatus, urlPeriod, urlAffiliateId],
  );

  const { payouts, pagination, isLoadingPayouts } = useGetAffiliatePayouts(queryParams);
  const { generatePayouts, isGeneratingPayouts, generatedRun, resetGeneratedRun } = useGenerateAffiliatePayouts();
  const { markPayoutPaid, isMarkingPayoutPaid } = useMarkAffiliatePayoutPaid();
  const { voidPayout, isVoidingPayout } = useVoidAffiliatePayout();

  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;

  function setParam(key, value) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function goToPage(p) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const activeFilterCount = [urlStatus !== '', urlPeriod !== '', urlAffiliateId !== ''].filter(Boolean).length;

  const totals = useMemo(() => {
    const acc = { pending: 0, paid: 0, absorbed: 0, pendingCount: 0, currencies: new Set() };
    payouts.forEach((p) => {
      if (p.currency) acc.currencies.add(p.currency);
      if (p.status === 'PENDING') {
        acc.pending += Number(p.commissionAmount || 0);
        acc.pendingCount += 1;
      }
      if (p.status === 'PAID') {
        acc.paid += Number(p.commissionAmount || 0);
        acc.absorbed += Number(p.absorbedRefundAmount || 0);
      }
    });
    return acc;
  }, [payouts]);

  const displayCurrency = totals.currencies.size === 1 ? [...totals.currencies][0] : null;

  function handleRun(period) {
    generatePayouts({ period });
  }

  function handleMarkPaid(payload) {
    markPayoutPaid(
      { id: payingPayout._id, payload },
      { onSuccess: () => setPayingPayout(null) },
    );
  }

  function handleVoid() {
    voidPayout(voidingTarget._id, { onSuccess: () => setVoidingTarget(null) });
  }

  const statusControl = (className = '') => (
    <select
      value={localStatus}
      onChange={(e) => {
        setLocalStatus(e.target.value);
        setParam('status', e.target.value);
      }}
      className={`${selectCls} ${className}`}
    >
      {STATUS_OPTIONS.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );

  return (
    <>
      {generateOpen && (
        <GenerateModal
          onClose={() => {
            setGenerateOpen(false);
            resetGeneratedRun();
          }}
          onRun={handleRun}
          running={isGeneratingPayouts}
          run={generatedRun}
          onReset={resetGeneratedRun}
        />
      )}

      {detailId && <DetailModal id={detailId} onClose={() => setDetailId(null)} />}

      {payingPayout && (
        <MarkPaidModal
          payout={payingPayout}
          onClose={() => setPayingPayout(null)}
          onConfirm={handleMarkPaid}
          saving={isMarkingPayoutPaid}
        />
      )}

      {voidingTarget && (
        <VoidModal
          payout={voidingTarget}
          onClose={() => setVoidingTarget(null)}
          onConfirm={handleVoid}
          saving={isVoidingPayout}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link
              href="/admin/affiliates"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-primary-700 transition mb-1"
            >
              <ArrowLeft size={13} /> Affiliates
            </Link>
            <h2 className="text-2xl font-extrabold text-gray-900">Payouts</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {isLoadingPayouts ? 'Loading…' : `${total} payout${total !== 1 ? 's' : ''} total`}
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => setGenerateOpen(true)}
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white transition shrink-0"
            >
              <Play size={13} /> Run a month
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
          {isLoadingPayouts ? (
            <StatSkeletons />
          ) : (
            <>
              <StatCard
                label="Pending estimate"
                value={fmtMoney(totals.pending, displayCurrency)}
                sub="Live figure, still moves with refunds"
                accent="text-amber-700"
              />
              <StatCard
                label="Paid on this page"
                value={fmtMoney(totals.paid, displayCurrency)}
                sub="Frozen record of money sent"
                accent="text-green-700"
              />
              <StatCard
                label="Absorbed refunds"
                value={fmtMoney(totals.absorbed, displayCurrency)}
                sub="Paid out then refunded, never clawed back"
                accent="text-gray-900"
              />
              <StatCard
                label="Pending payouts"
                value={String(totals.pendingCount)}
                sub="On this page, awaiting payment"
                accent="text-blue-700"
              />
            </>
          )}
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900">
          <span className="font-bold">Pending amounts are estimates.</span> They are recalculated on every read, and a
          refund quietly reduces them, so nothing is final until you record the payment. Once a payout is paid its
          amounts are frozen as the record of what was actually sent.
        </div>

        <div className="flex items-center gap-3 w-full">
          <div className="hidden sm:block">{statusControl()}</div>
          <div className="flex-1" />
          <button
            onClick={() => setFiltersOpen(true)}
            title="Filters"
            aria-label="Filters"
            className="relative shrink-0 flex items-center text-gray-800 hover:text-black transition-colors"
          >
            <SlidersHorizontal size={18} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 flex items-center justify-center text-[9px] font-bold text-white bg-primary-600 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {filtersOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
            onClick={() => setFiltersOpen(false)}
          >
            <div
              className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-5 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">Filters</h3>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</label>
                {statusControl('w-full')}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Period</label>
                <input
                  type="month"
                  value={localPeriod}
                  onChange={(e) => {
                    setLocalPeriod(e.target.value);
                    setParam('period', e.target.value);
                  }}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Affiliate ID</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={localAffiliateId}
                  maxLength={9}
                  placeholder="9 digits"
                  onChange={(e) => {
                    const next = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setLocalAffiliateId(next);
                    if (next.length === 9 || next.length === 0) setParam('affiliateId', next);
                  }}
                  className={`${inputCls} font-mono tracking-widest`}
                />
              </div>

              <button
                onClick={() => setFiltersOpen(false)}
                className="w-full py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {isLoadingPayouts ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={22} className="animate-spin text-gray-300" />
            </div>
          ) : payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Wallet size={22} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">No payouts found</p>
                <p className="text-xs text-gray-400 mt-1">
                  {canManage ? 'Run a month to claim commissionable orders into payouts.' : 'Try adjusting the filters above.'}
                </p>
              </div>
              {canManage && (
                <button
                  onClick={() => setGenerateOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-xl transition-colors"
                >
                  <Play size={13} /> Run a month
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      {['Affiliate', 'Period', 'Orders', 'Commission', 'Absorbed', 'Status', 'Paid', 'Reference', ''].map(
                        (h, i) => (
                          <th
                            key={i}
                            className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payouts.map((payout) => (
                      <tr key={payout._id} className="hover:bg-gray-50/60 transition-colors group">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setDetailId(payout._id)}
                            className="block text-left font-semibold text-gray-900 leading-snug hover:text-primary-700 hover:underline transition-colors"
                          >
                            {affiliateName(payout)}
                          </button>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{payout.affiliateId}</p>
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{periodLabel(payout)}</td>

                        <td className="px-4 py-3 text-sm text-gray-600">{payout.orderCount ?? 0}</td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">
                              {fmtMoney(payout.commissionAmount, payout.currency)}
                            </span>
                            <AmountStateBadge status={payout.status} />
                          </div>
                          {payout.status === 'PENDING' && (
                            <p className="text-[10px] text-gray-400 mt-0.5">Estimate, not final</p>
                          )}
                          <CurrencyNote currency={payout.currency} />
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {payout.absorbedRefundAmount > 0 ? (
                            <>
                              <span className="text-sm font-semibold text-amber-700">
                                {fmtMoney(payout.absorbedRefundAmount, payout.currency)}
                              </span>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {payout.absorbedRefundCount ?? 0} refund
                                {payout.absorbedRefundCount === 1 ? '' : 's'} absorbed
                              </p>
                            </>
                          ) : (
                            <span className="text-sm text-gray-300">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={payout.status} />
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                          {payout.paidAt ? fmtDate(payout.paidAt) : '—'}
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-500 font-mono max-w-[160px] truncate" title={payout.reference || ''}>
                          {payout.reference || '—'}
                        </td>

                        <td className="px-4 py-3 w-32">
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button
                              onClick={() => setDetailId(payout._id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition"
                              title="View details"
                            >
                              <Eye size={14} />
                            </button>
                            {canManage && (
                              <>
                                <button
                                  onClick={() => setPayingPayout(payout)}
                                  disabled={payout.status !== 'PENDING' || !(Number(payout.commissionAmount) > 0)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-green-700 hover:bg-green-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                  title={
                                    payout.status !== 'PENDING'
                                      ? 'Only a pending payout can be marked paid'
                                      : Number(payout.commissionAmount) > 0
                                        ? 'Mark paid'
                                        : 'Nothing payable in this payout'
                                  }
                                >
                                  <CheckCircle2 size={14} />
                                </button>
                                <button
                                  onClick={() => setVoidingTarget(payout)}
                                  disabled={payout.status !== 'PENDING'}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                  title={payout.status === 'PENDING' ? 'Void' : 'A paid or void payout cannot be voided'}
                                >
                                  <Ban size={14} />
                                </button>
                              </>
                            )}
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
                    Page {page} of {totalPages} · {total} total
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={!pagination?.hasPrevPage}
                      onClick={() => goToPage(page - 1)}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      disabled={!pagination?.hasNextPage}
                      onClick={() => goToPage(page + 1)}
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
    </>
  );
}

export default function AdminAffiliatePayoutsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      }
    >
      <PayoutsContent />
    </Suspense>
  );
}
