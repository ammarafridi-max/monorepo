'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, AlertCircle, Info, Loader2, ShieldQuestion } from 'lucide-react';
import Container from '../../shared/layout/Container.js';
import PrimarySection from '../../shared/layout/PrimarySection.js';
import { COUNTRIES } from '../../../data/countries.js';
import { checkVisaRequirementApi } from '../../../services/apiVisaRequirements.js';

/**
 * How each outcome is presented.
 *
 * The tone is deliberate. A "visa required" answer is the one worth selling
 * against, so it gets the strongest call to action. A "no visa needed" answer
 * gets none — pushing a service at someone who does not need one is how a tool
 * like this loses the trust that makes it worth linking to.
 */
const OUTCOME_UI = {
  VISA_FREE: {
    label: 'No visa needed',
    tone: 'ok',
    icon: Check,
    blurb: 'You can travel without applying for a visa in advance.',
  },
  VISA_ON_ARRIVAL: {
    label: 'Visa on arrival',
    tone: 'warn',
    icon: Info,
    blurb: 'You can get your visa at the border, but check the conditions before you fly.',
  },
  EVISA: {
    label: 'E-visa required',
    tone: 'warn',
    icon: Info,
    blurb: 'You need to apply online before you travel.',
  },
  ETA: {
    label: 'Travel authorisation required',
    tone: 'warn',
    icon: Info,
    blurb: 'Not a full visa, but you must be approved online before you board.',
  },
  VISA_REQUIRED: {
    label: 'Visa required',
    tone: 'alert',
    icon: AlertCircle,
    blurb: 'You need to apply and be approved before you travel.',
  },
  UNKNOWN: {
    label: 'We do not have this one yet',
    tone: 'muted',
    icon: ShieldQuestion,
    blurb: 'We have not verified the rules for this destination, so we would rather say nothing than guess.',
  },
};

const TONE = {
  ok: 'border-green-200 bg-green-50 text-green-800',
  warn: 'border-amber-200 bg-amber-50 text-amber-800',
  alert: 'border-red-200 bg-red-50 text-red-800',
  muted: 'border-gray-200 bg-gray-50 text-gray-600',
};

const SELECT_CLS =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500';

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label}
        {hint && <span className="ml-1.5 font-normal text-gray-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function CountrySelect({ value, onChange, placeholder, name }) {
  return (
    <select className={SELECT_CLS} value={value} onChange={(e) => onChange(e.target.value)} name={name}>
      <option value="">{placeholder}</option>
      {COUNTRIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

export default function VisaChecker({
  title = 'Do I need a visa?',
  subtitle = 'Tell us your passport and where you are going. We will tell you what you need, and we will tell you when you need nothing at all.',
  consultHref = '/visa',
  extraDestinations = [],
}) {
  const [nationality, setNationality] = useState('');
  const [residence, setResidence] = useState('');
  const [destination, setDestination] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const destinations = [...extraDestinations, ...COUNTRIES];

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!nationality || !destination) {
      setError('Pick your nationality and where you are going.');
      return;
    }
    setLoading(true);
    try {
      const res = await checkVisaRequirementApi({ nationality, residence, destination });
      setResult(res?.data ?? res);
    } catch (err) {
      setError(err?.message || 'Something went wrong. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  const ui = result ? OUTCOME_UI[result.outcome] ?? OUTCOME_UI.UNKNOWN : null;
  const Icon = ui?.icon;
  const needsVisa = result && ['VISA_REQUIRED', 'EVISA', 'ETA'].includes(result.outcome);

  return (
    <PrimarySection className="py-14 md:py-20">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{title}</h1>
        <p className="mt-3 leading-relaxed text-gray-500">{subtitle}</p>

        <form onSubmit={onSubmit} className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Your nationality">
            <CountrySelect name="nationality" value={nationality} onChange={setNationality} placeholder="Select passport" />
          </Field>
          <Field label="You live in" hint="(optional)">
            <CountrySelect name="residence" value={residence} onChange={setResidence} placeholder="Select country" />
          </Field>
          <Field label="Going to">
            <CountrySelect name="destination" value={destination} onChange={setDestination} placeholder="Select destination" />
          </Field>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:opacity-60"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? 'Checking' : 'Check requirements'}
            </button>
            <p className="mt-2 text-xs text-gray-400">
              Adding where you live matters. A residence permit can change the answer for the same passport.
            </p>
          </div>
        </form>

        {error && (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {result && ui && (
          <div className="mt-8">
            <div className={`rounded-2xl border px-5 py-4 ${TONE[ui.tone]}`}>
              <p className="flex items-center gap-2 text-lg font-bold">
                <Icon size={18} />
                {ui.label}
              </p>
              <p className="mt-1 text-sm">{ui.blurb}</p>
              {result.maxStayDays ? (
                <p className="mt-2 text-sm font-semibold">Up to {result.maxStayDays} days.</p>
              ) : null}
              {result.note ? <p className="mt-2 text-sm">{result.note}</p> : null}
            </div>

            {/* Only sell when there is something to sell and we handle it. */}
            {needsVisa && result.isServiced && (
              <div className="mt-5 rounded-2xl border border-primary-200 bg-white p-5 shadow-[0_4px_20px_rgba(16,24,40,0.06)]">
                <p className="text-base font-bold text-gray-900">We handle this one.</p>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  A specialist reviews every document against current embassy requirements, prepares the file and
                  books your appointment. Most refusals come from mistakes that were preventable.
                </p>
                <Link
                  href={result.visaSlug ? `/visa/${result.visaSlug}` : consultHref}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
                >
                  See what is involved <ArrowRight size={15} />
                </Link>
              </div>
            )}

            {(result.officialSourceUrl || result.lastVerifiedAt) && (
              <p className="mt-4 text-xs leading-relaxed text-gray-400">
                {result.lastVerifiedAt
                  ? `Last checked ${new Date(result.lastVerifiedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}. `
                  : ''}
                {result.officialSourceUrl ? (
                  <>
                    Source:{' '}
                    <a
                      href={result.officialSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-gray-600"
                    >
                      {result.officialSourceName || 'official government site'}
                    </a>
                    .{' '}
                  </>
                ) : null}
                Rules change without notice and the embassy has the final say. Always confirm before you book.
              </p>
            )}
          </div>
        )}
      </Container>
    </PrimarySection>
  );
}
