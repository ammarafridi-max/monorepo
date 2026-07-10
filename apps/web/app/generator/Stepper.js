'use client';

import { usePathname } from 'next/navigation';
import { FUNNEL_STEPS } from '../../lib/generator';

// Which funnel step the current route is on, so the stepper can render each step
// as done / current / upcoming. Pay has no route past the Stripe redirect.
function currentKey(pathname) {
  if (pathname?.startsWith('/generator/upload')) return 'upload';
  if (pathname?.startsWith('/generator/pay')) return 'pay';
  return 'select';
}

export default function Stepper() {
  const activeKey = currentKey(usePathname());
  const activeIdx = FUNNEL_STEPS.findIndex((s) => s.key === activeKey);

  return (
    <nav className="stepper" aria-label="Progress">
      <ol className="stepper__list">
        {FUNNEL_STEPS.map((step, i) => {
          const state = i < activeIdx ? 'done' : i === activeIdx ? 'current' : 'upcoming';
          return (
            <li key={step.key} className={`stepper__step stepper__step--${state}`}>
              <span className="stepper__num">{i + 1}</span>
              <span className="stepper__label">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
