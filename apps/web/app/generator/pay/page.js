'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LOOKS, ATTIRE, AGE_RANGES, GENDERS, RACES, FACIAL_HAIR } from '@picturesk/shared/catalog';
import { readState } from '../../../lib/generator';
import { createCheckout } from '../../../lib/api';
import { track, EVENTS } from '../../../lib/analytics';

const LOOK_LABEL = Object.fromEntries(LOOKS.map((l) => [l.id, l.label]));
const ATTIRE_LABEL = Object.fromEntries(ATTIRE.map((a) => [a.id, a.label]));
const GENDER_LABEL = Object.fromEntries(GENDERS.map((g) => [g.id, g.label]));
const AGE_LABEL = Object.fromEntries(AGE_RANGES.map((a) => [a.id, a.label]));
const RACE_LABEL = Object.fromEntries(RACES.map((r) => [r.id, r.label]));
const FACIAL_HAIR_LABEL = Object.fromEntries(FACIAL_HAIR.map((f) => [f.id, f.label]));

// Step 3: review + pay. Creating the order happens HERE (the first DB write), with
// the selections AND the already-uploaded photos. The CTA calls /checkout (which
// runs the server gate before creating the Stripe session) and redirects to Stripe.
export default function PayPage() {
  const router = useRouter();
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Per-photo gate failures from a 422 ({ index, reason }), so we can show the
  // customer EXACTLY which photos to swap and why.
  const [failures, setFailures] = useState([]);

  useEffect(() => {
    const s = readState();
    // Guard the funnel order.
    if (s.looks.length === 0 || s.attire.length === 0 || !s.gender || !s.ageRange)
      return router.replace('/generator/select');
    if (s.images.length === 0) return router.replace('/generator/upload');
    setState(s);
  }, [router]);

  if (!state) return null;

  async function onPay() {
    if (busy) return;
    setBusy(true);
    setError('');
    setFailures([]);
    track(EVENTS.CHECKOUT_STARTED);
    try {
      const { orderId, checkoutUrl } = await createCheckout({
        email: state.email,
        selectedLooks: state.looks,
        selectedAttire: state.attire,
        gender: state.gender,
        ageRange: state.ageRange,
        race: state.race,
        facialHair: state.facialHair,
        uploadedImageUrls: state.images,
      });
      // Best-effort: link the order to the logged-in account (no-op if anonymous).
      await fetch('/api/orders/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      }).catch(() => {});
      window.location.href = checkoutUrl;
    } catch (err) {
      if (err.status === 422) {
        const body = err.body || {};
        if (Array.isArray(body.failures) && body.failures.length) {
          // Show which specific photos failed and why, with thumbnails.
          setFailures(body.failures);
        } else {
          // A count problem (too few / too many), no per-photo detail.
          setError(body.countError || 'Your photos did not pass our check. Please adjust them.');
        }
        setBusy(false);
        return;
      }
      setError(err.message || 'Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <section>
      <p className="eyebrow">Step 3</p>
      <h1 className="h2">Review and pay.</h1>
      <p className="section__lede">One price, thirty-five dollars. No subscription.</p>

      <dl className="review">
        <div className="review__row">
          <dt className="review__k">Looks</dt>
          <dd className="review__v">{state.looks.map((id) => LOOK_LABEL[id]).join(', ')}</dd>
        </div>
        <div className="review__row">
          <dt className="review__k">Attire</dt>
          <dd className="review__v">{state.attire.map((id) => ATTIRE_LABEL[id]).join(', ')}</dd>
        </div>
        <div className="review__row">
          <dt className="review__k">You</dt>
          <dd className="review__v">
            {[
              GENDER_LABEL[state.gender],
              AGE_LABEL[state.ageRange],
              RACE_LABEL[state.race],
              FACIAL_HAIR_LABEL[state.facialHair],
            ]
              .filter(Boolean)
              .join(', ')}
          </dd>
        </div>
        <div className="review__row">
          <dt className="review__k">Photos</dt>
          <dd className="review__v">{state.images.length} uploaded</dd>
        </div>
        <div className="review__row">
          <dt className="review__k">Email</dt>
          <dd className="review__v">{state.email}</dd>
        </div>
      </dl>

      <div className="gennav">
        <a className="btn btn--link" href="/generator/upload">
          Back
        </a>
        <button className="btn btn--primary" type="button" disabled={busy} onClick={onPay}>
          {busy ? 'Taking you to payment' : 'Pay and start'} <span className="btn__price">$35</span>
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {failures.length > 0 && (
        <div className="gatefail">
          <p className="error">
            {failures.length === 1 ? 'This photo did' : `${failures.length} of your photos did`} not
            pass our check. Swap {failures.length === 1 ? 'it' : 'them'} and try again.
          </p>
          <div className="thumbs">
            {failures.map((f) => (
              <div className="thumb thumb--bad" key={f.index}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={state.images[f.index]} alt={`photo ${f.index + 1}`} />
                <p className="thumb__reason">{f.reason}</p>
              </div>
            ))}
          </div>
          <p className="formnote" style={{ textAlign: 'left', marginTop: 10 }}>
            <a href="/generator/upload">Back to your photos</a> to replace them.
          </p>
        </div>
      )}
      <p className="formnote" style={{ textAlign: 'left' }}>
        By continuing you agree to our <a href="/terms">Terms</a> and{' '}
        <a href="/privacy">Privacy Policy</a>.
      </p>
    </section>
  );
}
