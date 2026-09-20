'use client';

import { useEffect, useState } from 'react';
import { catalogFor } from '@travel-suite/picturesk-shared/catalog';
import { tiersFor, getTier, isFreeTier } from '@travel-suite/picturesk-shared/pricing';
import { readState, writeState } from '../../lib/generator';
import { funnelPaths, productConfig } from '../../lib/products';
import { useFunnel, useNextHref } from './FunnelContext';
import { OptionGrid, withPreview } from './controls';
import StepNav from './StepNav';
import Check from '../Check';
import Cross from '../Cross';

const usd = (cents) => `$${Math.round(cents / 100)}`;
const plural = (n, noun) => `${n} ${noun}${n === 1 ? '' : 's'}`;
const scope = (n, noun) => (n == null ? `All ${noun}s` : plural(n, noun));

// What a plan includes and does not, as one checklist, so the cards compare
// line for line. Built from the tier data so it can never drift from what is sold.
const featuresFor = (t, lookNoun) => [
  { ok: true, text: `${t.deliverCount} photos` },
  { ok: true, text: scope(t.attireCount, 'outfit') },
  { ok: true, text: scope(t.lookCount, lookNoun) },
  { ok: t.priority <= 2, text: t.priority === 1 ? 'Front of the queue' : 'Priority queue' },
  { ok: !isFreeTier(t), text: 'Look-like-you money-back guarantee' },
];

// Step 3: plan, then scenes and outfits within that plan's caps. Everything
// persists to localStorage as it changes.
export default function PlanStep({ product }) {
  const paths = funnelPaths(product);
  const cfg = productConfig(product);
  const { freeUsed } = useFunnel();
  const nextHref = useNextHref(paths.photos, paths.review);
  const catalog = catalogFor(product);
  const LOOK_OPTIONS = withPreview(catalog.looks);
  const ATTIRE_OPTIONS = withPreview(catalog.attire);
  const lookNoun = cfg.lookNoun;
  // The free plan is once per account; after that it is simply not offered.
  const TIERS = tiersFor(product).filter((t) => !(freeUsed && isFreeTier(t)));

  const [looks, setLooks] = useState([]);
  const [attire, setAttire] = useState([]);
  const [tier, setTier] = useState(cfg.defaultTier);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = readState(product);
    setLooks(s.looks);
    setAttire(s.attire);
    const stored = getTier(s.tier);
    setTier(freeUsed && isFreeTier(stored) ? cfg.defaultTier : s.tier);
    setReady(true);
  }, [product, freeUsed, cfg.defaultTier]);

  const plan = getTier(tier);
  const lookCap = plan.lookCount ?? LOOK_OPTIONS.length;
  const attireCap = plan.attireCount ?? ATTIRE_OPTIONS.length;
  const looksFull = looks.length >= lookCap;
  const attireFull = attire.length >= attireCap;

  function pickTier(id) {
    setTier(id);
    const next = getTier(id);
    const patch = { tier: id };
    if (next.lookCount != null && looks.length > next.lookCount) {
      patch.looks = looks.slice(0, next.lookCount);
      setLooks(patch.looks);
    }
    if (next.attireCount != null && attire.length > next.attireCount) {
      patch.attire = attire.slice(0, next.attireCount);
      setAttire(patch.attire);
    }
    writeState(patch, product);
  }

  function toggleLook(id) {
    setLooks((prev) => {
      if (!prev.includes(id) && prev.length >= lookCap) return prev;
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeState({ looks: next }, product);
      return next;
    });
  }
  function toggleAttire(id) {
    setAttire((prev) => {
      if (!prev.includes(id) && prev.length >= attireCap) return prev;
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeState({ attire: next }, product);
      return next;
    });
  }

  const missing =
    looks.length === 0
      ? `Choose at least one ${lookNoun} to continue.`
      : looks.length > lookCap
        ? `${plan.label} includes up to ${plural(lookCap, lookNoun)}. Remove some or pick a bigger plan.`
        : attire.length === 0
          ? 'Choose at least one outfit to continue.'
          : attire.length > attireCap
            ? `${plan.label} includes up to ${plural(attireCap, 'outfit')}. Remove some or pick a bigger plan.`
            : '';

  return (
    <section>
      <h1 className="h2">{cfg.selectTitle}</h1>
      <p className="section__lede">Pick your plan, then the {lookNoun}s and outfits it includes.</p>

      <h3 className="gen-subhead">Plan</h3>
      <p className="gen-hint">One time, no subscription. Choose how many photos you want.</p>
      <div className="plans" role="radiogroup" aria-label="Pricing plan">
        {TIERS.map((t) => {
          const on = tier === t.id;
          const free = isFreeTier(t);
          return (
            <button
              type="button"
              key={t.id}
              className={`plan${on ? ' plan--on' : ''}`}
              role="radio"
              aria-checked={on}
              onClick={() => pickTier(t.id)}
            >
              {t.popular && <span className="plan__badge">Most popular</span>}
              {free && <span className="plan__badge plan__badge--free">Try it once</span>}
              <span className="plan__name">{t.label}</span>
              <span className="plan__price">{free ? '$0' : usd(t.priceCents)}</span>
              <ul className="plan__features">
                {featuresFor(t, lookNoun).map((f) => (
                  <li className={`plan__feature${f.ok ? '' : ' plan__feature--no'}`} key={f.text}>
                    {f.ok ? <Check /> : <Cross />}
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <h3 className="gen-subhead">{cfg.lookLabel}</h3>
      <p className="gen-hint">
        {plan.lookCount == null ? cfg.lookHint : `${plan.label} includes up to ${plural(lookCap, lookNoun)}. Choose which.`}{' '}
        <span className="gen-count">
          {looks.length} of {lookCap} selected
        </span>
      </p>
      {looksFull && plan.lookCount != null && (
        <p className="gen-hint gen-hint--cap">
          That is all {plan.label} includes. Deselect one to swap it, or pick a bigger plan above for more.
        </p>
      )}
      <OptionGrid items={LOOK_OPTIONS} selected={looks} onToggle={toggleLook} showDesc full={looksFull} />

      <h3 className="gen-subhead">{cfg.attireLabel}</h3>
      <p className="gen-hint">
        {plan.attireCount == null
          ? cfg.attireHint
          : plan.attireCount === 1
            ? `${plan.label} includes one outfit, worn across the whole set.`
            : `${plan.label} includes up to ${plural(attireCap, 'outfit')}. Choose which.`}{' '}
        <span className="gen-count">
          {attire.length} of {attireCap} selected
        </span>
      </p>
      {attireFull && plan.attireCount != null && (
        <p className="gen-hint gen-hint--cap">
          That is all {plan.label} includes. Deselect one to swap it, or pick a bigger plan above for more.
        </p>
      )}
      <OptionGrid items={ATTIRE_OPTIONS} selected={attire} onToggle={toggleAttire} showDesc={false} full={attireFull} />

      <StepNav backHref={paths.about} nextHref={nextHref} canContinue={ready && !missing} missing={ready ? missing : ''} />
    </section>
  );
}
