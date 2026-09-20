'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  catalogFor,
  AGE_RANGES,
  GENDERS,
  RACES,
  FACIAL_HAIR,
  BUILDS,
  HEIGHTS,
} from '@travel-suite/picturesk-shared/catalog';
import { getTier, isFreeTier } from '@travel-suite/picturesk-shared/pricing';
import { readState } from '../../lib/generator';
import { createCheckout } from '../../lib/api';
import { track, EVENTS } from '../../lib/analytics';
import { funnelPaths, productConfig } from '../../lib/products';
import { useFunnel } from './FunnelContext';
import StepNav from './StepNav';

const usd = (cents) => `$${Math.round(cents / 100)}`;
const labels = (list) => Object.fromEntries(list.map((x) => [x.id, x.label]));
const GENDER_LABEL = labels(GENDERS);
const AGE_LABEL = labels(AGE_RANGES);
const RACE_LABEL = labels(RACES);
const FACIAL_HAIR_LABEL = labels(FACIAL_HAIR);
const BUILD_LABEL = labels(BUILDS);
const HEIGHT_LABEL = labels(HEIGHTS);

// Step 5: review, then pay. Every row has a Change link that opens its step with
// ?return=review, so one choice can be corrected without touching the rest (the
// state lives in localStorage per product). Creating the order happens HERE: a
// paid plan goes to Stripe Checkout, a free plan starts straight away.
export default function ReviewStep({ product }) {
  const paths = funnelPaths(product);
  const cfg = productConfig(product);
  const { email, reusable } = useFunnel();
  const catalog = catalogFor(product);
  const LOOK_LABEL = labels(catalog.looks);
  const ATTIRE_LABEL = labels(catalog.attire);
  const router = useRouter();
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [failures, setFailures] = useState([]);

  useEffect(() => {
    const s = readState(product);
    if (!s.gender || !s.ageRange || !s.build || !s.height) return router.replace(paths.about);
    if (s.looks.length === 0 || s.attire.length === 0) return router.replace(paths.plan);
    if (s.images.length === 0 && !s.reuseFromOrderId) return router.replace(paths.photos);
    setState(s);
    track(EVENTS.PAYMENT_VIEW, { product });
  }, [router, product, paths.about, paths.plan, paths.photos]);

  if (!state) return null;

  const tier = getTier(state.tier);
  const free = isFreeTier(tier);
  const reusing = Boolean(state.reuseFromOrderId);
  const change = (href) => `${href}?return=review`;

  async function onPay() {
    if (busy) return;
    setBusy(true);
    setError('');
    setFailures([]);
    track(EVENTS.CHECKOUT_STARTED, { product, tier: tier.id });
    try {
      const { checkoutUrl } = await createCheckout({
        selectedLooks: state.looks,
        selectedAttire: state.attire,
        gender: state.gender,
        ageRange: state.ageRange,
        race: state.race,
        facialHair: state.facialHair,
        build: state.build,
        height: state.height,
        uploadedImageUrls: reusing ? [] : state.images,
        reuseFromOrderId: reusing ? state.reuseFromOrderId : undefined,
        tier: state.tier,
        product,
      });
      // State stays until the success page confirms payment, so a Stripe cancel
      // brings the customer back to a review page that still has their choices.
      window.location.href = checkoutUrl;
    } catch (err) {
      if (err.status === 401) return router.push(`/login?next=${encodeURIComponent(paths.review)}`);
      if (err.status === 403) return router.push(`/verify?next=${encodeURIComponent(paths.review)}`);
      if (err.status === 422) {
        const body = err.body || {};
        if (Array.isArray(body.failures) && body.failures.length) setFailures(body.failures);
        else setError(body.countError || 'Your photos did not pass our check. Please adjust them.');
        setBusy(false);
        return;
      }
      setError(err.message || 'Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  const rows = [
    {
      k: 'Plan',
      v: `${tier.label}, ${tier.deliverCount} ${cfg.noun}, ${free ? 'free' : usd(tier.priceCents)}`,
      href: paths.plan,
    },
    { k: cfg.lookLabel, v: state.looks.map((id) => LOOK_LABEL[id]).filter(Boolean).join(', '), href: paths.plan },
    { k: cfg.attireLabel, v: state.attire.map((id) => ATTIRE_LABEL[id]).filter(Boolean).join(', '), href: paths.plan },
    {
      k: 'You',
      v: [GENDER_LABEL[state.gender], AGE_LABEL[state.ageRange], RACE_LABEL[state.race], FACIAL_HAIR_LABEL[state.facialHair]]
        .filter(Boolean)
        .join(', '),
      href: paths.about,
    },
    { k: 'Height', v: HEIGHT_LABEL[state.height], href: paths.about },
    { k: 'Build', v: BUILD_LABEL[state.build], href: paths.about },
    {
      k: 'Photos',
      v: reusing ? `Reusing the model from your order of ${reusable?.date ?? 'an earlier date'}` : `${state.images.length} uploaded`,
      href: paths.photos,
    },
    { k: 'Email', v: email, mask: true },
  ];

  return (
    <section>
      <h1 className="h2">{free ? 'Review and start.' : 'Review and pay.'}</h1>
      <p className="section__lede">{free ? 'Your free set. No card needed.' : 'One time. No subscription.'}</p>

      <dl className="review">
        {rows.map((r) => (
          <div className="review__row" key={r.k}>
            <dt className="review__k">{r.k}</dt>
            <dd className="review__v" data-clarity-mask={r.mask ? 'true' : undefined}>
              {r.v}
            </dd>
            {r.href && (
              <dd className="review__change">
                <Link href={change(r.href)}>Change</Link>
              </dd>
            )}
          </div>
        ))}
      </dl>

      <StepNav
        backHref={paths.photos}
        canContinue={!busy}
        label={busy ? (free ? 'Starting your set' : 'Taking you to payment') : free ? 'Start my free set' : 'Pay and start'}
        trailing={!free ? <span className="btn__price">{usd(tier.priceCents)}</span> : null}
        onContinue={onPay}
      />

      {!free && (
        <p className="formnote formnote--left">
          <strong>Look-like-you guarantee.</strong> If your {cfg.noun} don&apos;t look like you, email us within 3
          days and we&apos;ll refund you in full. Have a promo code? You can enter it on the payment page.
        </p>
      )}

      {error && <p className="error">{error}</p>}

      {failures.length > 0 && (
        <div className="gatefail">
          <p className="error">
            {failures.length === 1 ? 'This photo did' : `${failures.length} of your photos did`} not pass our check.
            Swap {failures.length === 1 ? 'it' : 'them'} and try again.
          </p>
          <div className="thumbs" data-clarity-mask="true">
            {failures.map((f) => (
              <div className="thumb thumb--bad" key={f.index}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={state.images[f.index]} alt={`photo ${f.index + 1}`} />
                <p className="thumb__reason">{f.reason}</p>
              </div>
            ))}
          </div>
          <p className="formnote formnote--left" style={{ marginTop: 10 }}>
            <Link href={change(paths.photos)}>Back to your photos</Link> to replace them.
          </p>
        </div>
      )}
      <p className="formnote formnote--left">
        By continuing you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
      </p>
    </section>
  );
}
