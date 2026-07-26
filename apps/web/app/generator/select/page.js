'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LOOKS, ATTIRE, AGE_RANGES, GENDERS, RACES, FACIAL_HAIR } from '@picturesk/shared/catalog';
import { TIERS } from '@picturesk/shared/pricing';
import { readState, writeState } from '../../../lib/generator';

// Whole-dollar price from integer cents (tier prices are round dollars).
const usd = (cents) => `$${Math.round(cents / 100)}`;
// One line of "what changes" per tier: count first (verdict), then turnaround.
const TURNAROUND = { starter: 'Standard queue', pro: 'Priority queue', premium: 'Front of the queue' };

// A grid of selectable option cards, each with a preview image (or a placeholder
// until a real image URL is added to the catalog). The choices are the visual
// interest; cobalt marks the selected state.
function OptionGrid({ items, selected, onToggle, showDesc }) {
  return (
    <div className="cards">
      {items.map((it) => {
        const on = selected.includes(it.id);
        return (
          <button
            type="button"
            key={it.id}
            className={`option-card${on ? ' option-card--on' : ''}`}
            onClick={() => onToggle(it.id)}
            aria-pressed={on}
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
export default function SelectPage() {
  const router = useRouter();
  const [looks, setLooks] = useState([]);
  const [attire, setAttire] = useState([]);
  const [gender, setGender] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [race, setRace] = useState('');
  const [facialHair, setFacialHair] = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState('starter');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = readState();
    setLooks(s.looks);
    setAttire(s.attire);
    setGender(s.gender);
    setAgeRange(s.ageRange);
    setRace(s.race);
    setFacialHair(s.facialHair);
    setEmail(s.email);
    setTier(s.tier);
    setReady(true);
  }, []);

  function pickTier(id) {
    setTier(id);
    writeState({ tier: id });
  }

  function toggleLook(id) {
    setLooks((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeState({ looks: next });
      return next;
    });
  }
  function toggleAttire(id) {
    setAttire((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeState({ attire: next });
      return next;
    });
  }
  function onGender(v) {
    setGender(v);
    writeState({ gender: v });
    // Facial hair is hidden for women; clear any beard picked earlier so it
    // does not silently persist into the order.
    if (v === 'woman' && facialHair) onFacialHair('');
  }
  function onAgeRange(v) {
    setAgeRange(v);
    writeState({ ageRange: v });
  }
  function onRace(v) {
    setRace(v);
    writeState({ race: v });
  }
  function onFacialHair(v) {
    setFacialHair(v);
    writeState({ facialHair: v });
  }
  function onEmail(v) {
    setEmail(v);
    writeState({ email: v });
  }

  const emailOk = /.+@.+\..+/.test(email);
  const canContinue =
    ready && looks.length > 0 && attire.length > 0 && !!gender && !!ageRange && emailOk;

  return (
    <section>
      <p className="eyebrow">Step 1</p>
      <h1 className="h2">Choose your headshots.</h1>
      <p className="section__lede">
        Pick your plan, background, and attire, and tell us where to send the results.
      </p>

      <h3 className="gen-subhead">Plan</h3>
      <p className="gen-hint">One time, no subscription. Choose how many headshots you want.</p>
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
              <span className="plan__meta">{t.deliverCount} headshots</span>
              <span className="plan__meta">{TURNAROUND[t.id]}</span>
            </button>
          );
        })}
      </div>

      <h3 className="gen-subhead">Background</h3>
      <p className="gen-hint">Choose one or more backgrounds. We spread your set across them.</p>
      <OptionGrid items={LOOKS} selected={looks} onToggle={toggleLook} showDesc />

      <h3 className="gen-subhead">Attire</h3>
      <p className="gen-hint">Choose what you want to wear. Mix a few for variety.</p>
      <OptionGrid items={ATTIRE} selected={attire} onToggle={toggleAttire} showDesc={false} />

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
          </p>
          <p className="gen-hint">Tell us your current look so your beard stays consistent in the results.</p>
          <ChoiceRow items={FACIAL_HAIR} value={facialHair} onSelect={onFacialHair} allowClear />
        </>
      )}

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
        <Link className="btn btn--link" href="/">
          Back
        </Link>
        <button
          className="btn btn--primary"
          type="button"
          disabled={!canContinue}
          onClick={() => router.push('/generator/upload')}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
