'use client';

import { usePathname } from 'next/navigation';
import { funnelSteps } from '../lib/generator';
import { productForPath } from '../lib/products';

// Which funnel step the current route is on, so the stepper can render each step
// as done / current / upcoming. Pay has no route past the Stripe redirect.
function currentKey(pathname) {
  const last = pathname?.split('/').pop();
  if (last === 'capture') return 'photos';
  return ['about', 'build', 'plan', 'photos', 'review'].includes(last) ? last : 'about';
}

export default function Stepper() {
  const pathname = usePathname();
  const activeKey = currentKey(pathname);
  const FUNNEL_STEPS = funnelSteps(productForPath(pathname));
  const activeIdx = FUNNEL_STEPS.findIndex((s) => s.key === activeKey);

  const pct = Math.round((activeIdx / (FUNNEL_STEPS.length - 1)) * 100);

  return (
    <nav className="stepper" aria-label="Progress">
      <div
        className="stepper__bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`Step ${activeIdx + 1} of ${FUNNEL_STEPS.length}`}
      >
        <div className="stepper__fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="stepper__pct">
        <span>
          Step {activeIdx + 1} of {FUNNEL_STEPS.length}
        </span>
        <span>{pct}% complete</span>
      </p>
    </nav>
  );
}
