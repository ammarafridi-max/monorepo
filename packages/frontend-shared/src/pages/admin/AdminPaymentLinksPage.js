'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Copy, ExternalLink, Eye, Plus, Power, PowerOff, Trash2 } from 'lucide-react';
import Breadcrumb from '../../components/v1/layout/Breadcrumb';
import PageLoader from '../../components/v1/ui/PageLoader';
import PageHeading from '../../components/v1/layout/PageHeading';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  usePaymentLinks,
  useCreatePaymentLink,
  useDeletePaymentLink,
  useSetPaymentLinkActive,
} from '../../hooks/payments/usePaymentLinks';
import AdminPaymentLinkModal from './AdminPaymentLinkModal';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPaymentLinksPage() {
  const router = useRouter();
  const { adminUser: user, isLoadingAdminAuth: loading } = useAdminAuth();
  const isAllowed = user?.role === 'admin' || user?.role === 'agent';

  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { paymentLinks, pagination, isLoadingPaymentLinks } = usePaymentLinks({
    status: statusFilter || undefined,
    page,
    limit: 20,
  });
  const { createPaymentLink, isCreatingPaymentLink } = useCreatePaymentLink();
  const { setActive, isSettingActive } = useSetPaymentLinkActive();
  const { deletePaymentLink, isDeletingPaymentLink } = useDeletePaymentLink();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!loading && !isAllowed) router.replace('/admin');
  }, [isAllowed, loading, router]);

  if (loading || !isAllowed) return <PageLoader />;

  function handleSave(payload) {
    createPaymentLink(payload, {
      onSuccess: () => setModalOpen(false),
    });
  }

  return (
    <>
      <Breadcrumb
        paths={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Payment Links', href: '/admin/payment-links' },
        ]}
      />

      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <PageHeading>Payment Links</PageHeading>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-800"
        >
          <Plus size={14} />
          New payment link
        </button>
      </div>

      {/* Status filter */}
      <div className="mt-6 flex items-center gap-2">
        {['', 'active', 'paid', 'inactive'].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary-700 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {s === '' ? 'All' : s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-3 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Created</th>
                <th className="px-5 py-3 text-left font-medium">Product</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Paid by</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingPaymentLinks ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    Loading…
                  </td>
                </tr>
              ) : paymentLinks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    No payment links yet.
                  </td>
                </tr>
              ) : (
                paymentLinks.map((link) => (
                  <PaymentLinkRow
                    key={link._id}
                    link={link}
                    onToggleActive={(active) => setActive({ id: link._id, active })}
                    isToggling={isSettingActive}
                    canDelete={isAdmin}
                    onDelete={() => {
                      if (
                        typeof window !== 'undefined' &&
                        !window.confirm(
                          `Delete this payment link? This will deactivate it on Stripe and remove the record.`,
                        )
                      ) {
                        return;
                      }
                      deletePaymentLink(link._id);
                    }}
                    isDeleting={isDeletingPaymentLink}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
            <span>
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="rounded border border-gray-200 px-2 py-1 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded border border-gray-200 px-2 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <AdminPaymentLinkModal
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          saving={isCreatingPaymentLink}
        />
      )}
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PaymentLinkRow({ link, onToggleActive, isToggling, canDelete, onDelete, isDeleting }) {
  // Treat any legacy 'pending' rows as active for display + toggling.
  const effectiveStatus = link.status === 'pending' ? 'active' : link.status;
  const canToggle = effectiveStatus === 'active' || effectiveStatus === 'inactive';
  const created = link.createdAt
    ? new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(link.createdAt))
    : '—';

  const amount = (() => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: (link.currency || 'AED').toUpperCase(),
        maximumFractionDigits: 2,
      }).format(link.amount);
    } catch {
      return `${(link.currency || '').toUpperCase()} ${Number(link.amount).toFixed(2)}`;
    }
  })();

  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-5 py-3 text-gray-600">{created}</td>
      <td className="px-5 py-3 text-gray-900">
        <div className="font-medium">
          {link.lineItems?.length > 1 ? (
            <span>
              {link.lineItems.length} items
              <span className="ml-1.5 text-xs font-normal text-gray-500">
                ({link.lineItems
                  .map((li) => `${li.productName}${li.quantity > 1 ? ` × ${li.quantity}` : ''}`)
                  .join(', ')})
              </span>
            </span>
          ) : (
            <>
              {link.productName || '—'}
              {link.quantity > 1 && (
                <span className="ml-1.5 text-xs font-normal text-gray-500">× {link.quantity}</span>
              )}
            </>
          )}
        </div>
        {link.description && (
          <div className="text-xs text-gray-500">{link.description}</div>
        )}
      </td>
      <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-gray-900">
        {amount}
      </td>
      <td className="px-5 py-3">
        <StatusPill status={effectiveStatus} />
      </td>
      <td className="px-5 py-3 text-gray-700">
        {effectiveStatus === 'paid' ? (
          <>
            <div className="font-medium">{link.paidByName || '—'}</div>
            {link.paidByEmail && (
              <div className="text-xs text-gray-500">{link.paidByEmail}</div>
            )}
          </>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
      <td className="whitespace-nowrap px-5 py-3 text-right">
        <div className="inline-flex items-center gap-1">
          <IconAction
            label="Copy link"
            onClick={() => {
              navigator.clipboard.writeText(link.url);
              toast.success('Link copied');
            }}
          >
            <Copy size={14} />
          </IconAction>
          <IconAction as={Link} href={`/admin/payment-links/${link._id}`} label="View details">
            <Eye size={14} />
          </IconAction>
          <IconAction
            as="a"
            href={link.url}
            target="_blank"
            rel="noreferrer"
            label="Open hosted link"
          >
            <ExternalLink size={14} />
          </IconAction>
          {canToggle && (
            <IconAction
              label={effectiveStatus === 'active' ? 'Disable link' : 'Enable link'}
              variant={effectiveStatus === 'active' ? 'danger' : 'success'}
              disabled={isToggling}
              onClick={() => onToggleActive(effectiveStatus !== 'active')}
            >
              {effectiveStatus === 'active' ? (
                <PowerOff size={14} />
              ) : (
                <Power size={14} />
              )}
            </IconAction>
          )}
          {canDelete && effectiveStatus !== 'paid' && (
            <IconAction
              label="Delete link"
              variant="danger"
              disabled={isDeleting}
              onClick={onDelete}
            >
              <Trash2 size={14} />
            </IconAction>
          )}
        </div>
      </td>
    </tr>
  );
}

// Icon-only action button. Wraps native <button>, <a>, or next/Link.
function IconAction({ as: Tag = 'button', label, variant = 'default', children, ...rest }) {
  const variantCls = {
    default: 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
    danger: 'text-gray-500 hover:bg-red-50 hover:text-red-600',
    success: 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-700',
  }[variant];

  const className = `inline-flex h-8 w-8 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:opacity-40 ${variantCls}`;

  if (Tag === 'button') {
    return (
      <button type="button" title={label} aria-label={label} className={className} {...rest}>
        {children}
      </button>
    );
  }
  return (
    <Tag title={label} aria-label={label} className={className} {...rest}>
      {children}
    </Tag>
  );
}

function StatusPill({ status }) {
  if (status === 'paid') {
    return (
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        Paid
      </span>
    );
  }
  if (status === 'inactive') {
    return (
      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
        Inactive
      </span>
    );
  }
  if (status === 'expired') {
    return (
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        Expired
      </span>
    );
  }
  // 'active' (and legacy 'pending')
  return (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      Active
    </span>
  );
}
