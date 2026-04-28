'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  CreditCard,
  User,
  Tag,
  Hash,
  Calendar,
  Receipt,
  Power,
  PowerOff,
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import Breadcrumb from '../../components/v1/layout/Breadcrumb';
import PageLoader from '../../components/v1/ui/PageLoader';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  useDeletePaymentLink,
  usePaymentLink,
  useSetPaymentLinkActive,
  useUpdatePaymentLink,
} from '../../hooks/payments/usePaymentLinks';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'AED').toUpperCase(),
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${(currency || '').toUpperCase()} ${Number(amount).toFixed(2)}`;
  }
}

function formatTimestamp(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

// ─── UI primitives ────────────────────────────────────────────────────────────

function Card({ title, icon: Icon, children, action }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={14} className="shrink-0 text-gray-400" />}
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {title}
          </p>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-50 py-2 last:border-0">
      <span className="shrink-0 text-sm text-gray-400">{label}</span>
      <span
        className={`break-all text-right text-sm font-semibold text-gray-800 ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value ?? '—'}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Paid
      </span>
    );
  }
  if (status === 'inactive') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <span className="h-2 w-2 rounded-full bg-red-400" />
        Inactive
      </span>
    );
  }
  if (status === 'expired') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
        <span className="h-2 w-2 rounded-full bg-gray-400" />
        Expired
      </span>
    );
  }
  // 'active' (and legacy 'pending')
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      Active
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPaymentLinkDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const { adminUser: user, isLoadingAdminAuth: loading } = useAdminAuth();
  const isAllowed = user?.role === 'admin' || user?.role === 'agent';

  const { paymentLink, isLoadingPaymentLink, isErrorPaymentLink, paymentLinkError } =
    usePaymentLink(id);
  const { setActive, isSettingActive } = useSetPaymentLinkActive();
  const { deletePaymentLink, isDeletingPaymentLink } = useDeletePaymentLink();
  const { updatePaymentLink, isUpdatingPaymentLink } = useUpdatePaymentLink();
  const isAdmin = user?.role === 'admin';

  // Inline description edit state
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');

  useEffect(() => {
    if (!loading && !isAllowed) router.replace('/admin');
  }, [isAllowed, loading, router]);

  if (loading || !isAllowed || isLoadingPaymentLink) return <PageLoader />;

  if (isErrorPaymentLink || !paymentLink) {
    return (
      <>
        <Breadcrumb
          paths={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Payment Links', href: '/admin/payment-links' },
            { label: 'Not found', href: '#' },
          ]}
        />
        <p className="mt-6 rounded-xl bg-white p-6 text-sm text-gray-700 shadow">
          {paymentLinkError?.message || 'Payment link not found.'}
        </p>
      </>
    );
  }

  const link = paymentLink;
  const amountFormatted = formatMoney(link.amount, link.currency);
  const effectiveStatus = link.status === 'pending' ? 'active' : link.status;
  const canToggle = effectiveStatus === 'active' || effectiveStatus === 'inactive';

  return (
    <>
      <Breadcrumb
        paths={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Payment Links', href: '/admin/payment-links' },
          { label: link.productName || 'Detail', href: `/admin/payment-links/${link._id}` },
        ]}
      />

      {/* Header strip */}
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => router.push('/admin/payment-links')}
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={12} /> Back to payment links
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {link.productName || 'Custom payment'}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={effectiveStatus} />
            <span className="text-sm text-gray-500">·</span>
            <span className="text-sm font-medium text-gray-700">{amountFormatted}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canToggle && (
            <button
              type="button"
              disabled={isSettingActive}
              onClick={() => {
                const next = effectiveStatus !== 'active';
                if (next) {
                  setActive({ id: link._id, active: true });
                } else {
                  if (
                    typeof window !== 'undefined' &&
                    !window.confirm(
                      'Disable this payment link? Customers will no longer be able to pay through it.',
                    )
                  ) {
                    return;
                  }
                  setActive({ id: link._id, active: false });
                }
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition disabled:opacity-50 ${
                effectiveStatus === 'active'
                  ? 'border-red-200 bg-white text-red-600 hover:bg-red-50'
                  : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {isSettingActive ? (
                <Loader2 size={13} className="animate-spin" />
              ) : effectiveStatus === 'active' ? (
                <PowerOff size={13} />
              ) : (
                <Power size={13} />
              )}
              {effectiveStatus === 'active' ? 'Disable' : 'Enable'}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(link.url);
              toast.success('Link copied');
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <Copy size={13} /> Copy link
          </button>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-800"
          >
            Open <ExternalLink size={13} />
          </a>
          {isAdmin && effectiveStatus !== 'paid' && (
            <button
              type="button"
              disabled={isDeletingPaymentLink}
              onClick={() => {
                if (
                  typeof window !== 'undefined' &&
                  !window.confirm(
                    'Delete this payment link? This will deactivate it on Stripe and remove the record.',
                  )
                ) {
                  return;
                }
                deletePaymentLink(link._id, {
                  onSuccess: () => router.push('/admin/payment-links'),
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
            >
              {isDeletingPaymentLink ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Cards grid */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Payment details" icon={CreditCard}>
          {link.lineItems?.length > 1 ? (
            <>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                Line items
              </p>
              <div className="mb-3 space-y-2">
                {link.lineItems.map((li, i) => (
                  <div
                    key={i}
                    className="flex items-baseline justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate text-gray-800">
                      {li.productName}
                      {li.quantity > 1 && (
                        <span className="ml-1.5 text-xs text-gray-500">× {li.quantity}</span>
                      )}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-gray-600">
                      {formatMoney(li.unitAmount * li.quantity, link.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <InfoRow label="Product / service" value={link.productName || '—'} />
              {link.productId && link.quantity > 0 && link.unitAmount != null && (
                <>
                  <InfoRow
                    label="Unit price"
                    value={formatMoney(link.unitAmount, link.currency)}
                  />
                  <InfoRow label="Quantity" value={`× ${link.quantity}`} />
                </>
              )}
            </>
          )}
          <InfoRow label="Amount" value={amountFormatted} />
          <InfoRow label="Currency" value={(link.currency || '').toUpperCase()} />
          <InfoRow label="Status" value={<StatusBadge status={effectiveStatus} />} />

          {/* Editable description row */}
          <div className="flex items-start justify-between gap-4 border-b border-gray-50 py-2 last:border-0">
            <span className="shrink-0 pt-1 text-sm text-gray-400">Description</span>
            {editingDescription ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="text"
                  value={descriptionDraft}
                  onChange={(e) => setDescriptionDraft(e.target.value)}
                  autoFocus
                  className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    updatePaymentLink(
                      { id: link._id, description: descriptionDraft },
                      { onSuccess: () => setEditingDescription(false) },
                    );
                  }}
                  disabled={isUpdatingPaymentLink}
                  className="rounded-lg bg-primary-700 p-1.5 text-white transition hover:bg-primary-800 disabled:opacity-50"
                  title="Save"
                >
                  {isUpdatingPaymentLink ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDescription(false)}
                  disabled={isUpdatingPaymentLink}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
                  title="Cancel"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="flex flex-1 items-start justify-end gap-2">
                <span className="break-all text-right text-sm font-semibold text-gray-800">
                  {link.description || '—'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDescriptionDraft(link.description || '');
                    setEditingDescription(true);
                  }}
                  className="shrink-0 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  title="Edit description"
                >
                  <Pencil size={11} />
                </button>
              </div>
            )}
          </div>
        </Card>

        <Card title="Customer (paid by)" icon={User}>
          {effectiveStatus === 'paid' ? (
            <>
              <InfoRow label="Name" value={link.paidByName || '—'} />
              <InfoRow label="Email" value={link.paidByEmail || '—'} />
              <InfoRow label="Paid at" value={formatTimestamp(link.paidAt)} />
            </>
          ) : (
            <p className="py-6 text-center text-sm text-gray-400">
              Not paid yet.
            </p>
          )}
        </Card>

        <Card title="Created by" icon={Tag}>
          <InfoRow label="Admin" value={link.createdBy?.name || '—'} />
          <InfoRow label="Email" value={link.createdBy?.email || '—'} />
          <InfoRow label="Created at" value={formatTimestamp(link.createdAt)} />
          <InfoRow label="Last updated" value={formatTimestamp(link.updatedAt)} />
        </Card>

        <Card title="Stripe references" icon={Hash}>
          <InfoRow label="Payment Link ID" value={link.stripePaymentLinkId} mono />
          <InfoRow label="Price ID" value={link.stripePriceId} mono />
          <InfoRow label="Product ID" value={link.stripeProductId || '—'} mono />
          <InfoRow label="Session ID" value={link.sessionId || '—'} mono />
          <InfoRow label="Transaction ID" value={link.transactionId || '—'} mono />
        </Card>

        {/* Full-width URL card */}
        <div className="lg:col-span-2">
          <Card title="Hosted URL" icon={Receipt}>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <code className="flex-1 truncate text-xs text-gray-700">{link.url}</code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(link.url);
                  toast.success('Link copied');
                }}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >
                <Copy size={12} /> Copy
              </button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
