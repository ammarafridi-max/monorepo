'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

// The fixed action bar at the bottom of every funnel step, the same pattern the
// travel brands use: white, full width, Back on the left, Continue on the right,
// and the one sentence that explains a disabled Continue in between. `.generator`
// leaves room for it at the bottom of the page.
export default function StepNav({
  backHref,
  nextHref,
  canContinue,
  missing,
  label = 'Continue',
  trailing,
  onContinue,
}) {
  const router = useRouter();
  return (
    <div className="stepbar">
      <div className="stepbar__inner">
        <Link className="btn btn--link stepbar__back" href={backHref}>
          Back
        </Link>
        {missing ? (
          <p id="step-missing" className="stepbar__hint">
            {missing}
          </p>
        ) : (
          <span className="stepbar__hint" aria-hidden="true" />
        )}
        <button
          className="btn btn--primary stepbar__next"
          type="button"
          disabled={!canContinue}
          aria-describedby={missing ? 'step-missing' : undefined}
          onClick={() => (onContinue ? onContinue() : router.push(nextHref))}
        >
          {label}
          {trailing}
        </button>
      </div>
    </div>
  );
}
