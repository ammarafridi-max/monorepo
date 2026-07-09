'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LOOKS, ATTIRE } from '@headliner/shared/catalog';
import { readState, writeState } from '../../../lib/generator';
import { createCheckout } from '../../../lib/api';
import { track, EVENTS } from '../../../lib/analytics';

const LOOK_LABEL = Object.fromEntries(LOOKS.map((l) => [l.id, l.label]));
const ATTIRE_LABEL = Object.fromEntries(ATTIRE.map((a) => [a.id, a.label]));

// Review + email + pay. Creating the order happens HERE (the first DB write), so
// abandoned selection steps never hit the database. Payment comes before upload:
// this CTA creates the order from the selections and redirects to Stripe.
export default function DetailsPage() {
  const router = useRouter();
  const [state, setState] = useState(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const s = readState();
    // Guard the funnel order: no selections means the user skipped a step.
    if (s.looks.length === 0) return router.replace('/generator/looks');
    if (s.attire.length === 0) return router.replace('/generator/attire');
    setState(s);
    setEmail(s.email);
  }, [router]);

  if (!state) return null;

  const emailOk = /.+@.+\..+/.test(email);

  async function onPay() {
    if (!emailOk || busy) return;
    setBusy(true);
    setError('');
    writeState({ email });
    track(EVENTS.CHECKOUT_STARTED);
    try {
      const { orderId, checkoutUrl } = await createCheckout({
        email,
        selectedLooks: state.looks,
        selectedAttire: state.attire,
      });
      // Best-effort: link the order to the logged-in account. The route no-ops for
      // anonymous visitors, so the anonymous flow is unchanged.
      await fetch('/api/orders/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      }).catch(() => {});
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <section>
      <p className="eyebrow">Step 3</p>
      <h1 className="h2">Review and pay.</h1>
      <p className="section__lede">
        One price, thirty-five dollars. You upload your photos right after payment.
      </p>

      <dl className="review">
        <div className="review__row">
          <dt className="review__k">Looks</dt>
          <dd className="review__v">{state.looks.map((id) => LOOK_LABEL[id]).join(', ')}</dd>
        </div>
        <div className="review__row">
          <dt className="review__k">Attire</dt>
          <dd className="review__v">{state.attire.map((id) => ATTIRE_LABEL[id]).join(', ')}</dd>
        </div>
      </dl>

      <div className="field">
        <label className="label" htmlFor="email">
          Where should we send them?
        </label>
        <input
          id="email"
          className="input"
          type="email"
          inputMode="email"
          placeholder="you@work.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
        />
      </div>

      <div className="gennav">
        <a className="btn btn--link" href="/generator/attire">
          Back
        </a>
        <button className="btn btn--primary" type="button" disabled={!emailOk || busy} onClick={onPay}>
          {busy ? 'Taking you to payment' : 'Continue to payment'} <span className="btn__price">$35</span>
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      <p className="formnote" style={{ textAlign: 'left' }}>
        By continuing you agree to our <a href="/terms">Terms</a> and{' '}
        <a href="/privacy">Privacy Policy</a>.
      </p>
    </section>
  );
}
