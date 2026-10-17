'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
