'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  RotateCw,
  Mail,
  Undo2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import {
  useAdminOrder,
  useRefundOrder,
  useRetryOrder,
  useResendOrderEmail,
  useDeleteOrder,
} from '../../../../../hooks/admin/useAdminOrders';
import { usd, dateTime, STATUS_LABEL } from '../../../../../lib/adminApi';

const RETRYABLE = ['PAID', 'TRAINING', 'GENERATING'];

const STATUS_CFG = {
  AWAITING_PAYMENT: { dot: 'bg-gray-400',   cls: 'bg-gray-100  text-gray-600   border-gray-200'   },
  PAID:             { dot: 'bg-blue-400',   cls: 'bg-blue-50   text-blue-700   border-blue-200'   },
  TRAINING:         { dot: 'bg-indigo-400', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  GENERATING:       { dot: 'bg-purple-400', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  DELIVERED:        { dot: 'bg-green-500',  cls: 'bg-green-50  text-green-700  border-green-200'  },
  FAILED:           { dot: 'bg-red-500',    cls: 'bg-red-50    text-red-700    border-red-200'    },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? { dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function Card({ title, action, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">{title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Row({ label, children, mono }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className={`text-sm text-gray-800 text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>
        {children ?? '—'}
      </span>
    </div>
  );
}

function ImageGrid({ title, urls }) {
  if (!urls?.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
        {title} <span className="text-gray-300">({urls.length})</span>
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2">
        {urls.map((url, i) => (
          <a
            key={`${url}-${i}`}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`${title} ${i + 1}`} className="w-full h-full object-cover" />
            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ExternalLink size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function AdminOrderDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { order, isLoadingOrder, error } = useAdminOrder(id);

  const { refund, isRefunding } = useRefundOrder();
  const { retry, isRetrying } = useRetryOrder();
  const { resend, isResending } = useResendOrderEmail();
  const { remove, isDeleting } = useDeleteOrder();

  const [confirming, setConfirming] = useState(null);

  if (isLoadingOrder) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto space-y-5">
        <BackLink />
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <p className="text-sm font-bold text-gray-600">Could not load this order</p>
          <p className="text-xs text-gray-400 mt-1">{error?.message || 'It may have been deleted.'}</p>
        </div>
      </div>
    );
  }

  const canRefund = Boolean(order.amountPaidCents) && !order.refundedAt;
  const canRetry = RETRYABLE.includes(order.status);
  const canResend = order.status === 'DELIVERED';
  const busy = isRefunding || isRetrying || isResending || isDeleting;

  const ACTIONS = {
    refund: {
      title: 'Refund this order?',
      body: `This refunds ${usd(order.amountPaidCents)} to the customer through Stripe. It cannot be undone.`,
      confirmLabel: 'Refund',
      danger: true,
      run: () => refund(order.orderId),
    },
    retry: {
      title: 'Requeue this order?',
      body: 'The worker picks the order up again from where it stopped. Safe to run more than once: each stage is idempotent, so nothing is trained or generated twice.',
      confirmLabel: 'Requeue',
      run: () => retry(order.orderId),
    },
    resend: {
      title: 'Resend the delivery email?',
      body: 'Sends the customer their headshots again, to the same address. No new images are generated.',
      confirmLabel: 'Send',
      run: () => resend(order.orderId),
    },
    delete: {
      title: 'Delete this order permanently?',
      body: "This removes the order record and the customer's uploaded photos from our storage. It cannot be undone. AI-generated images are hosted by Replicate and expire on their own.",
      confirmLabel: 'Delete',
      danger: true,
      run: () => remove(order.orderId, { onSuccess: () => router.push('/admin/orders') }),
    },
  };

  const active = confirming ? ACTIONS[confirming] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <BackLink />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-extrabold text-gray-900 break-all">
              {order.customerEmail || 'Unknown customer'}
            </h2>
            <StatusBadge status={order.status} />
            {order.stuck && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                <AlertTriangle size={11} />
                Stuck {order.stuckForMinutes}m
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-0.5 font-mono">{order.orderId}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ActionButton
            icon={RotateCw}
            label="Requeue"
            onClick={() => setConfirming('retry')}
            disabled={!canRetry || busy}
            title={canRetry ? 'Send this order back to the worker' : 'Only orders still in the pipeline can be requeued'}
          />
          <ActionButton
            icon={Mail}
            label="Resend email"
            onClick={() => setConfirming('resend')}
            disabled={!canResend || busy}
            title={canResend ? 'Email the headshots again' : 'Only delivered orders have an email to resend'}
          />
          <ActionButton
            icon={Undo2}
            label="Refund"
            onClick={() => setConfirming('refund')}
            disabled={!canRefund || busy}
            danger
            title={
              order.refundedAt
                ? `Already refunded on ${dateTime(order.refundedAt)}`
                : canRefund
                  ? 'Refund the customer through Stripe'
                  : 'Nothing was paid on this order'
            }
          />
          <ActionButton
            icon={Trash2}
            label="Delete"
            onClick={() => setConfirming('delete')}
            disabled={busy}
            danger
            title="Delete the order and its uploaded photos"
          />
        </div>
      </div>

      {order.error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">Failure</p>
          <p className="text-sm text-red-800 break-words">{order.error.message || String(order.error)}</p>
          {order.error.stage && (
            <p className="text-xs text-red-500 mt-1">Stage: {order.error.stage}</p>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Money">
          <Row label="Paid">{usd(order.amountPaidCents)}</Row>
          <Row label="Compute cost">{usd(order.computeCostCents)}</Row>
          <Row label="Margin">
            <span
              className={
                order.marginCents == null
                  ? 'text-gray-400'
                  : order.marginCents < 0
                    ? 'text-red-600 font-semibold'
                    : 'text-green-700 font-semibold'
              }
            >
              {order.marginCents == null ? 'Not delivered yet' : usd(order.marginCents)}
            </span>
          </Row>
          <Row label="Refunded">{order.refundedAt ? dateTime(order.refundedAt) : 'No'}</Row>
        </Card>

        <Card title="Request">
          <Row label="Looks">{order.selectedLooks?.join(', ') || '—'}</Row>
          <Row label="Attire">{order.selectedAttire?.join(', ') || '—'}</Row>
          <Row label="Gender">{order.gender}</Row>
          <Row label="Age range">{order.ageRange}</Row>
          <Row label="Race">{order.race}</Row>
          <Row label="Facial hair">
            {order.facialHair || order.derivedFacialHair || '—'}
            {order.derivedFacialHair && !order.facialHair && (
              <span className="text-gray-400"> (detected)</span>
            )}
          </Row>
        </Card>

        <Card title="Timeline">
          <Row label="Created">{dateTime(order.createdAt)}</Row>
          <Row label="Paid">{order.paidAt ? dateTime(order.paidAt) : '—'}</Row>
          <Row label="Training started">{order.trainingStartedAt ? dateTime(order.trainingStartedAt) : '—'}</Row>
          <Row label="Generating started">{order.generatingStartedAt ? dateTime(order.generatingStartedAt) : '—'}</Row>
          <Row label="Delivered">{order.deliveredAt ? dateTime(order.deliveredAt) : '—'}</Row>
          <Row label="Delivery email">{order.deliveredEmailSentAt ? dateTime(order.deliveredEmailSentAt) : '—'}</Row>
          <Row label="Failed">{order.failedAt ? dateTime(order.failedAt) : '—'}</Row>
        </Card>

        <Card title="External">
          <Row label="Stripe session" mono>{order.stripeSessionId}</Row>
          <Row label="Payment intent" mono>{order.stripePaymentIntentId}</Row>
          <Row label="Training id" mono>{order.replicate?.trainingId}</Row>
          <Row label="Trained version" mono>{order.replicate?.trainedModelVersion}</Row>
          <Row label="Generations">{order.replicate?.generationIds?.length || 0}</Row>
          <Row label="Training restarts">{order.replicate?.trainingRestarts ?? 0}</Row>
          <Row label="Account" mono>{order.userId || 'Guest checkout'}</Row>
        </Card>
      </div>

      <Card title="Images">
        <div className="space-y-5">
          <ImageGrid title="Delivered" urls={order.deliveredImageUrls} />
          <ImageGrid title="Enhanced" urls={order.enhancedImageUrls} />
          <ImageGrid title="Swapped" urls={order.swappedImageUrls} />
          <ImageGrid title="Candidates" urls={order.resultImageUrls} />
          <ImageGrid title="Uploaded by customer" urls={order.uploadedImageUrls} />
          {!order.deliveredImageUrls?.length &&
            !order.resultImageUrls?.length &&
            !order.uploadedImageUrls?.length && (
              <p className="text-sm text-gray-400 text-center py-6">No images on this order yet.</p>
            )}
        </div>
      </Card>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirming(null)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900">{active.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{active.body}</p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirming(null)}
                className="flex-1 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  active.run();
                  setConfirming(null);
                }}
                className={`flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition ${
                  active.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {active.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, disabled, danger, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        danger
          ? 'border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-700 hover:bg-red-50'
          : 'border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50'
      }`}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/orders"
      className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary-700 transition-colors"
    >
      <ArrowLeft size={14} />
      Back to orders
    </Link>
  );
}
