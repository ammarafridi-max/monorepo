'use client';

import Link from 'next/link';
import { ArrowRight, Check, AlertCircle, Info, ShieldQuestion } from 'lucide-react';
import VisaSearchBar, { SCHENGEN_OPTION } from './VisaSearchBar.js';
import { useVisaCheck } from '../../../hooks/visa/useVisaCheck.js';
import { useVisaDestinations } from '../../../hooks/visa/useVisaDestinations.js';
import { outcomeUi, OUTCOME_TONE, NEEDS_ACTION } from '../../../utils/visaOutcomes.js';


const OUTCOME_ICON = {
  VISA_FREE: Check,
  VISA_ON_ARRIVAL: Info,
  EVISA: Info,
  ETA: Info,
  VISA_REQUIRED: AlertCircle,
  UNKNOWN: ShieldQuestion,
};

export default function VisaCheckerInline({
  consultHref = '/visa',
  // Brands that segment visa pages by residence country pass the segment here,
  // e.g. basePath="/uae" to link /uae/visa/<slug>.
  basePath = '',
  extraDestinations = [SCHENGEN_OPTION],
  className = '',
}) {
  const v = useVisaCheck();
  const {
    destinations,
    loading: destinationsLoading,
    error: destinationsError,
  } = useVisaDestinations();

  const ui = v.result ? outcomeUi(v.result.outcome) : null;
  const tone = ui ? OUTCOME_TONE[ui.tone] : null;
  const Icon = v.result ? OUTCOME_ICON[v.result.outcome] ?? ShieldQuestion : null;
  const needsAction = v.result && NEEDS_ACTION.includes(v.result.outcome);

  return (
    <div className={className}>
      <VisaSearchBar
        nationality={v.nationality} setNationality={v.setNationality}
        residence={v.residence} setResidence={v.setResidence}
        destination={v.destination} setDestination={v.setDestination}
        destinations={destinations}
        onSubmit={v.submit}
        loading={v.loading || destinationsLoading}
        error={v.error || destinationsError}
        extraDestinations={extraDestinations}
      />

      {v.result && ui && (
        <div className="mt-6 text-left">
          <div className={`rounded-2xl border px-5 py-4 ${tone.box}`}>
            <p className={`flex items-center gap-2 text-lg font-bold ${tone.text}`}>
              <Icon size={18} />
              {ui.label}
            </p>
            <p className={`mt-1 text-sm ${tone.text}`}>{ui.blurb}</p>
            {v.result.maxStayDays ? (
              <p className={`mt-2 text-sm font-semibold ${tone.text}`}>Up to {v.result.maxStayDays} days.</p>
            ) : null}
            {v.result.note ? <p className={`mt-2 text-sm ${tone.text}`}>{v.result.note}</p> : null}
          </div>

          {/* Only sell when action is needed and we actually handle it. */}
          {needsAction && v.result.isServiced && (
            <div className="mt-5 rounded-2xl border border-primary-200 bg-white p-5 shadow-[0_4px_20px_rgba(16,24,40,0.06)]">
              <p className="text-base font-bold text-gray-900">We handle this one.</p>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                A specialist reviews every document against current embassy requirements, prepares the file and
                books your appointment. Most refusals come from mistakes that were preventable.
              </p>
              <Link
                href={v.result.visaSlug ? `${basePath}/visa/${v.result.visaSlug}` : consultHref}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
              >
                See what is involved <ArrowRight size={15} />
              </Link>
            </div>
          )}

          <p className="mt-4 text-xs leading-relaxed text-gray-400">
            {v.result.lastVerifiedAt
              ? `Last checked ${new Date(v.result.lastVerifiedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}. `
              : ''}
            {v.result.officialSourceUrl ? (
              <>
                Source:{' '}
                <a
                  href={v.result.officialSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-600"
                >
                  {v.result.officialSourceName || 'official government site'}
                </a>
                .{' '}
              </>
            ) : null}
            Rules change without notice and the embassy has the final say. Always confirm before you book.
          </p>
        </div>
      )}
    </div>
  );
}
