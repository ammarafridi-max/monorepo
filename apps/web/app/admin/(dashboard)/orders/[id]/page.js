'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getAdminOrder, usd, dateTime, STATUS_LABEL } from '../../../../../lib/adminApi';

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
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminOrder(id)
      .then(setOrder)
      .catch((e) => setError(e.status === 404 ? 'Order not found.' : e.message || 'Could not load order.'));
  }, [id]);

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
          <Row label="Looks">{order.selectedLooks?.join(', ')}</Row>
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

function BackLink() {
  return (
    <Link className="adm-back" href="/admin/orders">
      Back to orders
    </Link>
  );
}
