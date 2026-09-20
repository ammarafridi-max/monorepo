'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getOrder, downloadUrl, downloadAllUrl } from '../../../lib/api';
import { clearState } from '../../../lib/generator';
import { track, EVENTS } from '../../../lib/analytics';
import Lightbox from '../../../components/Lightbox';
import Container from '../../../components/Container';

// A small download glyph (arrow into a tray). Inline so it inherits currentColor
// and needs no asset request. Decorative; the control carries its own aria-label.
function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

// An eye glyph for "view larger". Same inline style as DownloadIcon.
function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Payment succeeded and the order is progressing or done. FAILED is excluded: it
// was paid but is being refunded, so counting it as a completed purchase would
// inflate the funnel.
const PAID_STATES = new Set(['PAID', 'TRAINING', 'GENERATING', 'DELIVERED']);

// The pipeline order. AWAITING_PAYMENT sits before the first visible step.
const nounFor = (order) => (order?.product === 'dating' ? 'dating photos' : 'headshots');
const landingFor = (order) => (order?.product === 'dating' ? '/ai-dating-photos' : '/ai-headshot-generator');

const stepsFor = (noun) => [
  { key: 'PAID', label: 'Payment received' },
  { key: 'TRAINING', label: 'Training a model on your face' },
  { key: 'GENERATING', label: `Making your ${noun}` },
  { key: 'DELIVERED', label: 'Delivered' },
];

const headlineFor = (noun) => ({
  AWAITING_PAYMENT: 'Waiting on your payment.',
  PAID: 'You are paid. Your session is starting.',
  TRAINING: 'We are training a model on your face.',
  GENERATING: `We are making your ${noun}.`,
  DELIVERED: `Your ${noun} are ready.`,
  FAILED: 'This run did not work out.',
});
const STEPS = stepsFor('headshots');

const SUBCOPY = {
  PAID: 'Your model starts training now. Most sets are ready in about an hour. You can close this page, we email you the link.',
  TRAINING: 'This is the slow part. You do not need to keep this page open, the results link goes to your email.',
  GENERATING: 'Almost there. We are rendering each shot now.',
  DELIVERED: 'They came out well. View and download them below.',
};

// FAILED copy is calm and depends on whether the refund has gone through.
function failedSubcopy(order) {
  const noun = nounFor(order);
  return order.refunded
    ? `We could not make ${noun} you would be happy with, so we refunded your payment in full. You can try again whenever you like.`
    : `We could not make ${noun} you would be happy with. Your refund is on its way, no action needed.`;
}

function currentIndex(status) {
  if (status === 'AWAITING_PAYMENT') return -1;
  return STEPS.findIndex((s) => s.key === status);
}

// Format a millisecond duration as a compact clock: "m:ss", or "h:mm:ss" past an
// hour. Returns null for missing/negative input so callers can skip rendering.
function fmtDuration(ms) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return null;
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export default function SuccessView() {
  const params = useSearchParams();
  const orderId = params.get('orderId');
  // The order's access token, from the Stripe success_url or the delivery email.
  const token = params.get('t');

  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  // The delivered image currently open in the lightbox (null = closed).
  const [preview, setPreview] = useState(null);
  // Ticks once a second so the "elapsed" clock advances between the 4s status polls.
  const [now, setNow] = useState(() => Date.now());

  // Fire purchase_completed exactly once, when the polled order first shows that
  // payment has gone through. No PII in the event.
  const purchasedRef = useRef(false);
  useEffect(() => {
    if (!purchasedRef.current && order && PAID_STATES.has(order.status)) {
      purchasedRef.current = true;
      track(EVENTS.PURCHASE_COMPLETED);
      clearState();
    }
  }, [order]);

  // Advance the elapsed clock every second while the order is still processing.
  // Stops once terminal (DELIVERED/FAILED), where the time is frozen at the total.
  const processing = order && order.status !== 'DELIVERED' && order.status !== 'FAILED';
  useEffect(() => {
    if (!processing) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [processing]);

  useEffect(() => {
    if (!orderId) {
      setError('No order id in the link.');
      return;
    }
    let alive = true;
    let timer;

    async function tick() {
      try {
        const data = await getOrder(orderId, token);
        if (!alive) return;
        setOrder(data);
        // Stop polling once the order is in a terminal state.
        if (data.status !== 'DELIVERED' && data.status !== 'FAILED') {
          timer = setTimeout(tick, 4000);
        }
      } catch (err) {
        if (!alive) return;
        setError(err.message);
        timer = setTimeout(tick, 6000);
      }
    }
    tick();

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [orderId, token]);

  if (error && !order) {
    return (
      <main className="page">
        <Container size="narrow">
          <h1 className="h2">We could not load this order.</h1>
          <p className="muted">{error}</p>
          <p>
            <a href="/ai-headshot-generator">Start a new order</a>
          </p>
        </Container>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="page">
        <Container size="narrow">
          <p className="muted">Loading your order.</p>
        </Container>
      </main>
    );
  }

  const status = order.status;
  const idx = currentIndex(status);
  const noun = nounFor(order);
  const HEADLINE = headlineFor(noun);
  const steps = stepsFor(noun);
  const isDelivered = status === 'DELIVERED';
  const isFailed = status === 'FAILED';
  const isGenerating = status === 'GENERATING';
  const wide = isDelivered && (order.resultImageUrls?.length ?? 0) > 0;

  // Processing time: counts up live while the order runs, then freezes at the total
  // once delivered. Anchored on paidAt (when the worker starts), falling back to
  // createdAt if the webhook has not stamped paidAt yet.
  const startMs = order.paidAt
    ? new Date(order.paidAt).getTime()
    : order.createdAt
      ? new Date(order.createdAt).getTime()
      : null;
  let timerLabel = null;
  let timerValue = null;
  if (startMs != null) {
    if (isDelivered && order.deliveredAt) {
      timerLabel = 'Processing time';
      timerValue = fmtDuration(new Date(order.deliveredAt).getTime() - startMs);
    } else if (!isDelivered && !isFailed) {
      timerLabel = 'Elapsed';
      timerValue = fmtDuration(now - startMs);
    }
  }

  // Live generation progress as a percentage. We show a percentage rather than a
  // raw "X of N" because we deliberately over-generate and then curate: "7 of 10"
  // would read as "3 failed" when nothing failed. Null total means generation has
  // only just started, so the bar runs in a calm indeterminate state instead.
  const pct =
    isGenerating && order.totalCount > 0
      ? Math.min(100, Math.round((order.generatedCount / order.totalCount) * 100))
      : null;

  return (
    <main className="page">
      <Container size={wide ? 'wide' : 'narrow'}>
        <span className={`pill${isDelivered ? ' pill--ok' : isFailed ? ' pill--warn' : ''}`}>
          {isDelivered
            ? 'Delivered'
            : isFailed
              ? order.refunded
                ? 'Refunded'
                : 'Refund on the way'
              : 'In progress'}
        </span>

        <h1 className="display" style={{ marginTop: 18 }}>
          {HEADLINE[status] || 'Working on your order.'}
        </h1>
        {isFailed ? (
          <p className="lede muted">{failedSubcopy(order)}</p>
        ) : (
          SUBCOPY[status] && <p className="lede muted">{SUBCOPY[status]}</p>
        )}
        {isFailed && (
          <p style={{ marginTop: 8 }}>
            <a href={landingFor(order)}>Start a new order</a>
          </p>
        )}

        {timerValue && (
          <p className="timer">
            <span className="timer__label">{timerLabel}</span>
            <span className="timer__value">{timerValue}</span>
          </p>
        )}

        {isDelivered ? (
          <section className="gallery">
            <div className="gallery__bar">
              <p className="gallery__count">
                {(order.resultImageUrls || []).length} {noun}, yours to keep.
              </p>
              {(order.resultImageUrls || []).length > 0 && (
                <a className="btn btn--primary" href={downloadAllUrl(orderId, token)}>
                  <DownloadIcon /> Download all
                </a>
              )}
            </div>
            {/* data-clarity-mask: the delivered headshots are the customer's face; never
                record them in Clarity session replay. */}
            <div className="gallery__grid" data-clarity-mask="true">
              {(order.resultImageUrls || []).map((url, i) => (
                <figure className="shot" key={url}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`headshot ${i + 1}`} />
                  <div className="shot__actions">
                    <button
                      type="button"
                      className="shot__view"
                      aria-label={`View headshot ${i + 1}`}
                      onClick={() => setPreview(url)}
                    >
                      <EyeIcon />
                    </button>
                    <a
                      className="shot__dl"
                      href={downloadUrl(orderId, i, token)}
                      aria-label={`Download headshot ${i + 1}`}
                    >
                      <DownloadIcon />
                    </a>
                  </div>
                </figure>
              ))}
            </div>
          </section>
        ) : isFailed ? null : (
          <>
            {isGenerating && (
              <div
                className="progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct ?? 0}
                aria-label={`Rendering your ${noun}`}
              >
                <div className="progress__track">
                  <div
                    className={`progress__fill${pct == null ? ' progress__fill--idle' : ''}`}
                    style={pct == null ? undefined : { width: `${pct}%` }}
                  />
                </div>
                <p className="progress__label">
                  {pct == null ? 'Warming up the studio.' : `${pct}% rendered.`}
                </p>
              </div>
            )}
            <ol className="steps">
              {steps.map((step, i) => {
                const cls =
                  i < idx ? 'step step--done' : i === idx ? 'step step--current' : 'step';
                return (
                  <li className={cls} key={step.key}>
                    <span className="step__dot" />
                    <span className="step__label">{step.label}</span>
                    {i === idx && <span className="step__detail">now</span>}
                    {i < idx && <span className="step__detail">done</span>}
                  </li>
                );
              })}
            </ol>
          </>
        )}

        <p className="formnote" style={{ textAlign: 'left', marginTop: 28 }}>
          Order {order.orderId}.{' '}
          {isDelivered
            ? 'A copy of your results link has been emailed to you.'
            : isFailed
              ? null
              : `We will email you this link as soon as your ${noun} are ready.`}
        </p>

        <Lightbox src={preview} alt="Headshot preview" onClose={() => setPreview(null)} />
      </Container>
    </main>
  );
}
