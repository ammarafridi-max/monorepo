'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

// The Back / Continue row every step ends with. `missing` is the one sentence
// that explains a disabled Continue.
export default function StepNav({ backHref, nextHref, canContinue, missing, label = 'Continue', onContinue }) {
  const router = useRouter();
  return (
    <>
      <div className="gennav">
        <Link className="btn btn--link" href={backHref}>
          Back
        </Link>
        <button
          className="btn btn--primary"
          type="button"
          disabled={!canContinue}
          aria-describedby={missing ? 'step-missing' : undefined}
          onClick={() => (onContinue ? onContinue() : router.push(nextHref))}
        >
          {label}
        </button>
      </div>
      {missing && (
        <p id="step-missing" className="formnote formnote--left">
          {missing}
        </p>
      )}
    </>
  );
}
