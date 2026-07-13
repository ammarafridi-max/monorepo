'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getOrder, downloadUrl } from '../../lib/api';
import { track, EVENTS } from '../../lib/analytics';

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

// Payment succeeded and the order is progressing or done. FAILED is excluded: it
// was paid but is being refunded, so counting it as a completed purchase would
// inflate the funnel.
const PAID_STATES = new Set(['PAID', 'TRAINING', 'GENERATING', 'DELIVERED']);

// The pipeline order. AWAITING_PAYMENT sits before the first visible step.
const STEPS = [
  { key: 'PAID', label: 'Payment received' },
  { key: 'TRAINING', label: 'Training a model on your face' },
  { key: 'GENERATING', label: 'Making your headshots' },
  { key: 'DELIVERED', label: 'Delivered' },
];

const HEADLINE = {
  AWAITING_PAYMENT: 'Waiting on your payment.',
  PAID: 'You are paid. Your session is starting.',
  TRAINING: 'We are training a model on your face.',
  GENERATING: 'We are making your headshots.',
  DELIVERED: 'Your headshots are ready.',
  FAILED: 'This run did not work out.',
};

const SUBCOPY = {
  PAID: 'This takes a few minutes. You can keep this page open.',
  TRAINING: 'This is the slow part, usually a few minutes. Leave this open.',
  GENERATING: 'Almost there. We are rendering each shot now.',
  DELIVERED: 'They came out well. View and download them below.',
};

// FAILED copy is calm and depends on whether the refund has gone through.
function failedSubcopy(order) {
  return order.refunded
    ? 'We could not make headshots you would be happy with, so we refunded your payment in full. You can try again whenever you like.'
    : 'We could not make headshots you would be happy with. Your refund is on its way, no action needed.';
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

  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  // Ticks once a second so the "elapsed" clock advances between the 4s status polls.
  const [now, setNow] = useState(() => Date.now());

  // Fire purchase_completed exactly once, when the polled order first shows that
  // payment has gone through. No PII in the event.
  const purchasedRef = useRef(false);
  useEffect(() => {
    if (!purchasedRef.current && order && PAID_STATES.has(order.status)) {
      purchasedRef.current = true;
      track(EVENTS.PURCHASE_COMPLETED);
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
        const data = await getOrder(orderId);
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
  }, [orderId]);

  if (error && !order) {
    return (
      <main className="wrap">
        <h1 className="h2">We could not load this order.</h1>
        <p className="muted">{error}</p>
        <p>
          <a href="/">Start a new order</a>
        </p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="wrap">
        <p className="muted">Loading your order.</p>
      </main>
    );
  }

  const status = order.status;
  const idx = currentIndex(status);
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

  // Download every headshot. Each href returns Content-Disposition: attachment, so
  // clicking a hidden anchor downloads rather than navigates. We stagger the clicks
  // so browsers don't collapse them into a single download or block the burst.
  function downloadAll() {
    const urls = order.resultImageUrls || [];
    urls.forEach((_, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = downloadUrl(orderId, i);
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, i * 400);
    });
  }

  return (
    <main className={`wrap${wide ? ' wrap--wide' : ''}`}>
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
          <a href="/">Start a new order</a>
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
              {(order.resultImageUrls || []).length} headshots, yours to keep.
            </p>
            {(order.resultImageUrls || []).length > 0 && (
              <button className="btn btn--primary" type="button" onClick={downloadAll}>
                <DownloadIcon /> Download all
              </button>
            )}
          </div>
          <div className="gallery__grid">
            {(order.resultImageUrls || []).map((url, i) => (
              <figure className="shot" key={url}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`headshot ${i + 1}`} />
                <a
                  className="shot__dl"
                  href={downloadUrl(orderId, i)}
                  aria-label={`Download headshot ${i + 1}`}
                >
                  <DownloadIcon />
                </a>
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
              aria-label="Rendering your headshots"
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
            {STEPS.map((step, i) => {
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
        Order {order.orderId}. A copy of your results link goes to {order.customerEmail}.
      </p>
    </main>
  );
}
