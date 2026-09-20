'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiInfo } from 'react-icons/fi';
import { catalogFor, AGE_RANGES, GENDERS, RACES, FACIAL_HAIR } from '@travel-suite/picturesk-shared/catalog';
import { tiersFor, isValidTier, getTier } from '@travel-suite/picturesk-shared/pricing';
import { readState, writeState } from '../../lib/generator';
import { track, EVENTS } from '../../lib/analytics';
import { funnelPaths, productConfig } from '../../lib/products';

// Whole-dollar price from integer cents (tier prices are round dollars).
const usd = (cents) => `$${Math.round(cents / 100)}`;
// One line of "what changes" per tier: count first (verdict), then turnaround.
const TURNAROUND = { 3: 'Standard queue', 2: 'Priority queue', 1: 'Front of the queue' };
const plural = (n, noun) => `${n} ${noun}${n === 1 ? '' : 's'}`;
const planScope = (t, lookNoun) =>
  t.attireCount == null && t.lookCount == null
    ? `All outfits and ${lookNoun}s`
    : `${plural(t.attireCount, 'outfit')}, ${plural(t.lookCount, lookNoun)}`;
// Only offer options that have a preview (an image or a swatch). The catalog entry
// stays so paid orders that already carry the id keep their prompt.
const withPreview = (items) => items.filter((it) => it.image || it.swatch);

// A grid of selectable option cards, each with a preview image (or a placeholder
// until a real image URL is added to the catalog). The choices are the visual
// interest; cobalt marks the selected state.
function OptionGrid({ items, selected, onToggle, showDesc, full }) {
  return (
    <div className="cards">
      {items.map((it) => {
        const on = selected.includes(it.id);
        const off = full && !on;
        return (
          <button
            type="button"
            key={it.id}
            className={`option-card${on ? ' option-card--on' : ''}${off ? ' option-card--off' : ''}`}
            onClick={() => onToggle(it.id)}
            aria-pressed={on}
            aria-disabled={off || undefined}
          >
            <span className="option-card__media">
              {it.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.image} alt="" loading="lazy" />
              ) : it.swatch ? (
                <span
                  className="option-card__swatch"
                  style={{ background: it.swatch }}
                  aria-hidden="true"
                />
              ) : (
                <span className="option-card__ph">Preview</span>
              )}
            </span>
            <span className="option-card__body">
              <span className="option-card__label">{it.label}</span>
              {showDesc && it.description ? (
                <span className="option-card__desc">{it.description}</span>
              ) : null}
              {it.note ? <span className="option-card__note">{it.note}</span> : null}
            </span>
            <span className="option-card__check" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

// A row of single-select chips: text-only pills (demographics have no preview
// image). Picking one clears the rest; an optional group can be un-picked by
// tapping the selected chip again. Cobalt marks the selected state.
function ChoiceRow({ items, value, onSelect, allowClear }) {
  return (
    <div className="chips">
      {items.map((it) => {
        const on = value === it.id;
        return (
          <button
            type="button"
            key={it.id}
            className={`chip${on ? ' chip--on' : ''}`}
            onClick={() => onSelect(on && allowClear ? '' : it.id)}
            aria-pressed={on}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

// Step 1: looks + attire + subject details + email, merged into one page.
// Everything persists to localStorage as it changes so the upload and pay steps
// can read it.
export default function SelectStep({ product }) {
  const paths = funnelPaths(product);
  const cfg = productConfig(product);
  const TIERS = tiersFor(product);
  const catalog = catalogFor(product);
  const LOOK_OPTIONS = withPreview(catalog.looks);
  const ATTIRE_OPTIONS = withPreview(catalog.attire);
  const lookNoun = cfg.lookNoun;
  const router = useRouter();
  const params = useSearchParams();
  const [looks, setLooks] = useState([]);
  const [attire, setAttire] = useState([]);
  const [gender, setGender] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [race, setRace] = useState('');
  const [facialHair, setFacialHair] = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState(cfg.defaultTier);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = readState(product);
    setLooks(s.looks);
    setAttire(s.attire);
    setGender(s.gender);
    setAgeRange(s.ageRange);
    setRace(s.race);
    setFacialHair(s.facialHair);
    setEmail(s.email);
    const fromUrl = params.get('tier');
    if (fromUrl && isValidTier(fromUrl) && getTier(fromUrl).product === cfg.id) {
      setTier(fromUrl);
      writeState({ tier: fromUrl }, product);
    } else {
      setTier(s.tier);
    }
    setReady(true);
  }, [params]);

  useEffect(() => {
    track(EVENTS.SELECT_VIEW, { product: cfg.id });
  }, [cfg.id]);

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
  function onGender(v) {
    setGender(v);
    writeState({ gender: v }, product);
    // Facial hair is hidden for women; clear any beard picked earlier so it
    // does not silently persist into the order.
    if (v === 'woman' && facialHair) onFacialHair('');
  }
  function onAgeRange(v) {
    setAgeRange(v);
    writeState({ ageRange: v }, product);
  }
  function onRace(v) {
    setRace(v);
    writeState({ race: v }, product);
  }
  function onFacialHair(v) {
    setFacialHair(v);
    writeState({ facialHair: v }, product);
  }
  function onEmail(v) {
    setEmail(v);
    writeState({ email: v }, product);
  }

  const emailOk = /.+@.+\..+/.test(email);
  const missing = !gender || !ageRange
    ? 'Tell us your gender and age range to continue.'
    : looks.length === 0
      ? `Choose at least one ${lookNoun} to continue.`
      : attire.length === 0
        ? 'Choose at least one outfit to continue.'
        : !emailOk
          ? 'Enter the email address for your results to continue.'
          : '';
  const canContinue = ready && !missing;

  return (
    <section>
      <p className="eyebrow">Step 1</p>
      <h1 className="h2">{cfg.selectTitle}</h1>
      <p className="section__lede">{cfg.selectLede}</p>

      <h3 className="gen-subhead">Plan</h3>
      <p className="gen-hint">One time, no subscription. Choose how many photos you want.</p>
      <div className="plans" role="radiogroup" aria-label="Pricing plan">
        {TIERS.map((t) => {
          const on = tier === t.id;
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
              <span className="plan__name">{t.label}</span>
              <span className="plan__price">{usd(t.priceCents)}</span>
              <span className="plan__meta">{t.deliverCount} photos</span>
              <span className="plan__meta">{planScope(t, lookNoun)}</span>
              <span className="plan__meta">{TURNAROUND[t.priority]}</span>
            </button>
          );
        })}
      </div>

      <h3 className="gen-subhead">About you</h3>
      <p className="gen-hint">This helps us render you accurately. It stays private.</p>

      <p className="gen-fieldlabel">Gender</p>
      <ChoiceRow items={GENDERS} value={gender} onSelect={onGender} />

      <p className="gen-fieldlabel">Age range</p>
      <ChoiceRow items={AGE_RANGES} value={ageRange} onSelect={onAgeRange} />

      <p className="gen-fieldlabel">
        Race <span className="gen-optional">optional</span>
      </p>
      <ChoiceRow items={RACES} value={race} onSelect={onRace} allowClear />

      {gender !== 'woman' && (
        <>
          <p className="gen-fieldlabel">
            Facial hair <span className="gen-optional">optional</span>
            <span
              className="info-tip"
              tabIndex={0}
              role="note"
              aria-label="Tell us your current look so your beard stays consistent in the results."
            >
              <FiInfo aria-hidden="true" />
              <span className="info-tip__bubble" role="tooltip">
                Tell us your current look so your beard stays consistent in the results.
              </span>
            </span>
          </p>
          <ChoiceRow items={FACIAL_HAIR} value={facialHair} onSelect={onFacialHair} allowClear />
        </>
      )}

      <h3 className="gen-subhead">{cfg.lookLabel}</h3>
      <p className="gen-hint">
        {plan.lookCount == null
          ? cfg.lookHint
          : `${plan.label} includes up to ${plural(lookCap, lookNoun)}. Choose which.`}{' '}
        <span className="gen-count">{looks.length} of {lookCap} selected</span>
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
        <span className="gen-count">{attire.length} of {attireCap} selected</span>
      </p>
      {attireFull && plan.attireCount != null && (
        <p className="gen-hint gen-hint--cap">
          That is all {plan.label} includes. Deselect one to swap it, or pick a bigger plan above for more.
        </p>
      )}
      <OptionGrid items={ATTIRE_OPTIONS} selected={attire} onToggle={toggleAttire} showDesc={false} full={attireFull} />

      <div className="field">
        <label className="label" htmlFor="email">
          Where should we send them?
        </label>
        <div className="input-icon">
          <svg
            className="input-icon__mark"
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <rect
              x="2.5"
              y="4"
              width="15"
              height="12"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M3 5.5 10 11l7-5.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            id="email"
            className="input input--onwhite"
            data-clarity-mask="true"
            type="email"
            inputMode="email"
            placeholder="you@work.com"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="gennav">
        <Link className="btn btn--link" href={paths.landing}>
          Back
        </Link>
        <button
          className="btn btn--primary"
          type="button"
          disabled={!canContinue}
          aria-describedby={missing ? 'select-missing' : undefined}
          onClick={() => router.push(paths.upload)}
        >
          Continue
        </button>
      </div>
      {ready && missing && (
        <p id="select-missing" className="formnote formnote--left">
          {missing}
        </p>
      )}
    </section>
  );
}
