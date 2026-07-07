'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getOrder } from '../../lib/api';

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

export default function SuccessView() {
  const params = useSearchParams();
  const orderId = params.get('orderId');

  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

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
  const wide = isDelivered && (order.resultImageUrls?.length ?? 0) > 0;

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

      {isDelivered ? (
        <section className="results">
          {(order.resultImageUrls || []).map((url, i) => (
            <figure className="result" key={url} style={{ margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`headshot ${i + 1}`} />
              <div className="result__bar">
                <a href={url} download={`headshot-${i + 1}.jpg`} target="_blank" rel="noreferrer">
                  Download
                </a>
              </div>
            </figure>
          ))}
        </section>
      ) : isFailed ? null : (
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
      )}

      <p className="formnote" style={{ textAlign: 'left', marginTop: 28 }}>
        Order {order.orderId}. A copy of your results link goes to {order.customerEmail}.
      </p>
    </main>
  );
}
