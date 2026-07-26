'use client';

import { Children, useRef, useState } from 'react';

/**
 * Accessible tabbed sections for the account page. The panels are server-rendered
 * (order list, settings forms) and passed in as children in the same order as
 * `tabs`; this client wrapper only toggles which one is visible. Follows the WAI
 * tabs pattern: roving tabindex, arrow/Home/End keys, aria-selected/controls.
 */
export default function AccountTabs({ tabs, children }) {
  const panels = Children.toArray(children);
  const [active, setActive] = useState(0);
  const btnRefs = useRef([]);

  function onKeyDown(e) {
    let next = null;
    if (e.key === 'ArrowRight') next = (active + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (active - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next !== null) {
      e.preventDefault();
      setActive(next);
      btnRefs.current[next]?.focus();
    }
  }

  return (
    <div className="tabs">
      <div className="tablist" role="tablist" aria-label="Account sections">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            ref={(el) => (btnRefs.current[i] = el)}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-controls={`panel-${t.key}`}
            aria-selected={active === i}
            tabIndex={active === i ? 0 : -1}
            className={`tab${active === i ? ' tab--on' : ''}`}
            onClick={() => setActive(i)}
            onKeyDown={onKeyDown}
          >
            {t.label}
            {typeof t.count === 'number' && t.count > 0 && (
              <span className="tab__count">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {tabs.map((t, i) => (
        <div
          key={t.key}
          role="tabpanel"
          id={`panel-${t.key}`}
          aria-labelledby={`tab-${t.key}`}
          hidden={active !== i}
          className="tabpanel"
          tabIndex={0}
        >
          {panels[i]}
        </div>
      ))}
    </div>
  );
}
