'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { readState, writeState } from '../../lib/generator';

// A multi-select step (looks or attire). Selections are the visual interest;
// cobalt is reserved for the selected state and the primary CTA (BRAND). Choices
// persist to localStorage as they are toggled, so navigating back and forth keeps
// them. `stepKey` is the localStorage field ('looks' | 'attire').
export default function SelectStep({ stepNo, stepKey, title, lede, items, back, next, showDesc = true }) {
  const router = useRouter();
  const [selected, setSelected] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSelected(readState()[stepKey] || []);
    setReady(true);
  }, [stepKey]);

  function toggle(id) {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeState({ [stepKey]: next });
      return next;
    });
  }

  return (
    <section>
      <p className="eyebrow">{stepNo}</p>
      <h1 className="h2">{title}</h1>
      <p className="section__lede">{lede}</p>

      <div className="cards">
        {items.map((it) => {
          const on = selected.includes(it.id);
          return (
            <button
              type="button"
              key={it.id}
              className={`card-select${on ? ' card-select--on' : ''}`}
              onClick={() => toggle(it.id)}
              aria-pressed={on}
            >
              <span className="card-select__check" aria-hidden="true" />
              <span className="card-select__label">{it.label}</span>
              {showDesc && it.description ? (
                <span className="card-select__desc">{it.description}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="gennav">
        <a className="btn btn--link" href={back}>
          Back
        </a>
        <button
          className="btn btn--primary"
          type="button"
          disabled={!ready || selected.length === 0}
          onClick={() => router.push(next)}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
