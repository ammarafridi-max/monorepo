'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../AdminAuthContext';
import {
  getAdminOrder,
  refundOrder,
  retryOrder,
  resendOrderEmail,
  deleteOrder,
  usd,
  dateTime,
  STATUS_LABEL,
} from '../../../../../lib/adminApi';

const RETRYABLE = ['PAID', 'TRAINING', 'GENERATING'];

function StatusPill({ status }) {
  const cls =
    status === 'DELIVERED' ? 'pill pill--ok' : status === 'FAILED' ? 'pill pill--warn' : 'pill';
  return <span className={cls}>{STATUS_LABEL[status] || status}</span>;
}

function ImageGrid({ title, urls }) {
  if (!urls || urls.length === 0) return null;
  return (
    <div className="adm-imgblock">
      <div className="adm-imgblock__title">
        {title} <span className="adm-muted">({urls.length})</span>
      </div>
      <div className="adm-imggrid">
        {urls.map((u, i) => (
          <a key={`${u}-${i}`} href={u} target="_blank" rel="noreferrer" className="adm-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt={`${title} ${i + 1}`} loading="lazy" />
          </a>
        ))}
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="adm-kv">
      <div className="adm-kv__k">{label}</div>
      <div className="adm-kv__v">{children ?? '-'}</div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const { adminUser } = useAdminAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    return getAdminOrder(id)
      .then(setOrder)
      .catch((e) => setError(e.status === 404 ? 'Order not found.' : e.message || 'Could not load order.'));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <>
        <BackLink />
        <p className="adm-error">{error}</p>
      </>
    );
  }
  if (!order) return <p className="adm-muted">Loading order</p>;

  const choices = [
    order.gender,
    order.ageRange,
    order.race,
    order.facialHair || order.derivedFacialHair,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <BackLink />

      <header className="adm-head adm-head--row">
        <div>
          <h1>Order {order.orderId.slice(-8)}</h1>
          <p className="adm-muted">{order.customerEmail}</p>
        </div>
        <div className="adm-head__aside">
          <StatusPill status={order.status} />
          {order.stuck && <span className="adm-flag">stuck {order.stuckForMinutes}m</span>}
        </div>
      </header>

      {adminUser?.role === 'admin' && <ActionsCard order={order} reload={load} />}

      {order.error && (
        <div className="adm-card adm-card--warn">
          <div className="adm-card__head">
            <h2>Error</h2>
          </div>
          <Row label="Stage">{order.error.stage}</Row>
          <Row label="Message">{order.error.message}</Row>
          <Row label="At">{dateTime(order.error.at)}</Row>
        </div>
      )}

      <div className="adm-cols">
        <section className="adm-card">
          <div className="adm-card__head">
            <h2>Money</h2>
          </div>
          <Row label="Paid">{usd(order.amountPaidCents)}</Row>
          <Row label="Compute cost">{usd(order.computeCostCents)}</Row>
          <Row label="Margin">{usd(order.marginCents)}</Row>
          <Row label="Refunded">{order.refundedAt ? dateTime(order.refundedAt) : 'No'}</Row>
        </section>

        <section className="adm-card">
          <div className="adm-card__head">
            <h2>Request</h2>
          </div>
          <Row label="Background">{order.selectedLooks?.join(', ')}</Row>
          <Row label="Attire">{order.selectedAttire?.join(', ')}</Row>
          <Row label="Subject">{choices}</Row>
          <Row label="Account">{order.userId ? 'Yes' : 'Guest'}</Row>
        </section>

        <section className="adm-card">
          <div className="adm-card__head">
            <h2>Timeline</h2>
          </div>
          <Row label="Created">{dateTime(order.createdAt)}</Row>
          <Row label="Paid">{dateTime(order.paidAt)}</Row>
          <Row label="Training">{dateTime(order.trainingStartedAt)}</Row>
          <Row label="Generating">{dateTime(order.generatingStartedAt)}</Row>
          <Row label="Delivered">{dateTime(order.deliveredAt)}</Row>
          <Row label="Email sent">{dateTime(order.deliveredEmailSentAt)}</Row>
          <Row label="Failed">{dateTime(order.failedAt)}</Row>
        </section>

        <section className="adm-card">
          <div className="adm-card__head">
            <h2>External</h2>
          </div>
          <Row label="Stripe session">{order.stripeSessionId}</Row>
          <Row label="Payment intent">{order.stripePaymentIntentId}</Row>
          <Row label="Training id">{order.replicate?.trainingId}</Row>
          <Row label="Model version">{order.replicate?.trainedModelVersion}</Row>
          <Row label="Generations">{order.replicate?.generationIds?.length || 0}</Row>
        </section>
      </div>

      <section className="adm-card">
        <div className="adm-card__head">
          <h2>Images</h2>
        </div>
        <ImageGrid title="Uploaded" urls={order.uploadedImageUrls} />
        <ImageGrid title="Delivered" urls={order.deliveredImageUrls} />
        <ImageGrid title="Enhanced" urls={order.enhancedImageUrls} />
        <ImageGrid title="Swapped" urls={order.swappedImageUrls} />
        <ImageGrid title="Raw candidates" urls={order.resultImageUrls} />
        {(order.uploadedImageUrls?.length ?? 0) === 0 &&
          (order.deliveredImageUrls?.length ?? 0) === 0 &&
          (order.resultImageUrls?.length ?? 0) === 0 && (
            <p className="adm-muted">No images yet.</p>
          )}
      </section>
    </>
  );
}

function ActionsCard({ order, reload }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const canRefund = Boolean(order.amountPaidCents) && !order.refundedAt;
  const canRetry = RETRYABLE.includes(order.status);
  const canResend = order.status === 'DELIVERED';

  async function onDelete() {
    const ok = window.confirm(
      'Delete this order permanently?\n\n' +
        'This removes the order record and the customer\'s uploaded photos from our storage. ' +
        'It cannot be undone. (AI-generated images are hosted by Replicate and expire on their own.)'
    );
    if (!ok) return;
    setBusy('delete');
    setMsg('');
    setError('');
    try {
      await deleteOrder(order.orderId);
      router.push('/admin/orders');
    } catch (e) {
      setError(e.message || 'Could not delete this order.');
      setBusy('');
    }
  }

  async function run(kind, fn, confirmMsg, successMsg) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(kind);
    setMsg('');
    setError('');
    try {
      await fn(order.orderId);
      await reload();
      setMsg(successMsg);
    } catch (e) {
      setError(e.message || 'Action failed.');
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="adm-card">
      <div className="adm-card__head">
        <h2>Actions</h2>
      </div>

      {msg && <p className="adm-ok">{msg}</p>}
      {error && <p className="adm-login__error">{error}</p>}

      <div className="adm-actionbar">
        <button
          type="button"
          className="adm-btn adm-btn--sm adm-btn--danger"
          disabled={!canRefund || Boolean(busy)}
          title={order.refundedAt ? 'Already refunded' : !order.amountPaidCents ? 'No payment to refund' : ''}
          onClick={() =>
            run('refund', refundOrder, 'Issue a Stripe refund for this order? This cannot be undone.', 'Refund issued.')
          }
        >
          {busy === 'refund' ? 'Refunding' : order.refundedAt ? 'Refunded' : 'Refund'}
        </button>

        <button
          type="button"
          className="adm-btn adm-btn--sm"
          disabled={!canRetry || Boolean(busy)}
          title={canRetry ? '' : 'Only a paid, in-progress order can be retried'}
          onClick={() =>
            run('retry', retryOrder, 'Re-queue this order for the worker to reattach?', 'Re-queued. The worker will pick it up.')
          }
        >
          {busy === 'retry' ? 'Re-queuing' : 'Retry'}
        </button>

        <button
          type="button"
          className="adm-btn adm-btn--sm"
          disabled={!canResend || Boolean(busy)}
          title={canResend ? '' : 'Only a delivered order has results to email'}
          onClick={() => run('resend', resendOrderEmail, null, 'Delivery email re-sent.')}
        >
          {busy === 'resend' ? 'Sending' : 'Resend email'}
        </button>
      </div>

      <p className="adm-muted adm-actionbar__note">
        Refund issues a Stripe refund and marks the order refunded (it does not cancel an in-flight run).
        Retry re-queues a stuck order. Resend re-sends the delivery email to the customer.
      </p>

      <div className="adm-danger">
        <div>
          <div className="adm-danger__title">Delete order</div>
          <div className="adm-muted">
            Removes the order and the uploaded photos from our storage. Permanent.
          </div>
        </div>
        <button
          type="button"
          className="adm-btn adm-btn--sm adm-btn--danger"
          disabled={Boolean(busy)}
          onClick={onDelete}
        >
          {busy === 'delete' ? 'Deleting' : 'Delete order'}
        </button>
      </div>
    </section>
  );
}

function BackLink() {
  return (
    <Link className="adm-back" href="/admin/orders">
      Back to orders
    </Link>
  );
}
