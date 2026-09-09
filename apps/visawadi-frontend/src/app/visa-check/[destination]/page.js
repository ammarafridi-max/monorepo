import { Fragment } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import { getPublicVisaRuleApi } from '@travel-suite/frontend-shared/services/apiVisaRequirements';
import { nullOn404 } from '@travel-suite/frontend-shared/services/apiClient';
import { OUTCOME_UI } from '@travel-suite/frontend-shared/utils/visaOutcomes';
import {
  SITE_URL,
  buildBreadcrumbList,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import { DEFAULT_COUNTRY } from '@/config/countries';
import {
  buildNationalityTable,
  isoParam,
  outcomeCounts,
  passportPhrase,
  resolveForNationality,
  withArticle,
} from '@/lib/visaCheck';

// Reading searchParams makes this route dynamic, so it is not prerendered.
// The upstream rule fetch is cached for an hour, which keeps TTFB in the low
// tens of milliseconds and lets a shared param link render its answer in HTML.
export const revalidate = 3600;

const slugFor = (code) => String(code).toLowerCase();

async function loadRule(destination) {
  const code = String(destination || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;
  const res = await getPublicVisaRuleApi(code).catch(nullOn404);
  return res?.data || res || null;
}

const TONE = {
  ok: 'border-green-200 bg-green-50 text-green-900',
  warn: 'border-amber-200 bg-amber-50 text-amber-900',
  alert: 'border-red-200 bg-red-50 text-red-900',
  muted: 'border-gray-200 bg-gray-50 text-gray-700',
};
const PILL = {
  ok: 'bg-green-100 text-green-800',
  warn: 'bg-amber-100 text-amber-800',
  alert: 'bg-red-100 text-red-800',
  muted: 'bg-gray-100 text-gray-700',
};
const ui = (outcome) => OUTCOME_UI[outcome] ?? OUTCOME_UI.UNKNOWN;

export async function generateMetadata({ params }) {
  const { destination } = await params;
  const rule = await loadRule(destination);
  if (!rule) return { title: 'Not found', robots: { index: false, follow: false } };

  const name = withArticle(rule.destination);
  const rows = buildNationalityTable(rule);
  const counts = outcomeCounts(rows);
  const free = counts.VISA_FREE || 0;

  const title = `Do You Need a Visa for ${withArticle(rule.destination)}?`;
  const description = free
    ? `${free} nationalities enter ${name} without a visa. Check whether yours does, what the stay limit is, and where to apply from the UAE.`
    : `Check whether your passport needs a visa for ${name}, what the stay limit is, and where to apply from the UAE.`;

  return {
    title,
    description,
    // Params personalise the answer; they never earn their own URL.
    alternates: { canonical: `${SITE_URL}/visa-check/${slugFor(rule.destination)}` },
    robots: { index: true, follow: true },
    openGraph: {
      url: `${SITE_URL}/visa-check/${slugFor(rule.destination)}`,
      title,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
    twitter: { card: 'summary_large_image', title, description, images: [`${SITE_URL}/og-image.png`] },
  };
}

export default async function VisaCheckDestinationPage({ params, searchParams }) {
  const { destination } = await params;
  const query = (await searchParams) || {};
  const rule = await loadRule(destination);
  if (!rule) notFound();

  const nationality = isoParam(query.nationality);
  const residence = isoParam(query.residence);
  const name = withArticle(rule.destination);
  const canonical = `${SITE_URL}/visa-check/${slugFor(rule.destination)}`;

  const rows = buildNationalityTable(rule, { residence });
  const counts = outcomeCounts(rows);
  const free = counts.VISA_FREE || 0;
  const answer = nationality ? resolveForNationality(rule, nationality, residence) : null;
  const answerUi = answer ? ui(answer.outcome) : null;

  // The visitor's own row first; everything else alphabetical.
  const ordered = nationality
    ? [...rows].sort((a, b) => (a.code === nationality ? -1 : b.code === nationality ? 1 : 0))
    : rows;

  // Two countries per visual row: Afghanistan and Albania sit side by side,
  // which halves a 238-row table without hiding anything from a crawler.
  const pairs = [];
  for (let i = 0; i < ordered.length; i += 2) pairs.push([ordered[i], ordered[i + 1] ?? null]);

  const verified = rule.lastVerifiedAt
    ? new Date(rule.lastVerifiedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const shortAnswer = answer
    ? `${answerUi.label} for ${passportPhrase(nationality)}${
        residence ? ` resident in ${withArticle(residence)}` : ''
      } travelling to ${name}. ${answer.note || answerUi.blurb}`
    : `${free} nationalities enter ${name} without a visa${
        rows.find((r) => r.outcome === 'VISA_FREE')?.maxStayDays
          ? ` for up to ${rows.find((r) => r.outcome === 'VISA_FREE').maxStayDays} days`
          : ''
      }. Every other passport needs one before travelling. Where you live changes where you apply, not whether you need it.`;

  const faqs = [
    {
      question: `Do you need a visa for ${name}?`,
      answer: shortAnswer,
    },
    ...(verified
      ? [
          {
            question: `When were the ${name} visa rules last checked?`,
            answer: `${verified}, against ${
              rule.officialSourceName || 'the official source'
            }. Requirements change without much notice, so confirm on the official page before you apply.`,
          },
        ]
      : []),
  ];

  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical, title: `Do You Need a Visa for ${name}?`, description: shortAnswer }),
    buildFAQPage({ canonical, title: `${rule.destinationName} visa requirements`, description: shortAnswer, faqs }),
    buildBreadcrumbList({
      paths: [
        { label: 'Home', path: '/' },
        { label: 'Visa check', path: '/visa-check' },
        { label: rule.destinationName, path: `/visa-check/${slugFor(rule.destination)}` },
      ],
    }),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />

      <PrimarySection className="bg-gray-900 py-12 text-white md:py-16">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
            Visa check
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight md:text-4xl">
            Do you need a visa for {name}?
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-gray-300">{shortAnswer}</p>
        </Container>
      </PrimarySection>

      <PrimarySection className="py-12 md:py-16">
        <Container>
          {answer ? (
            <div className={`rounded-2xl border px-5 py-4 ${TONE[answerUi.tone]}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${PILL[answerUi.tone]}`}>
                  {answerUi.label}
                </span>
                {answer.basis === 'residence' ? (
                  <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-gray-700">
                    Based on your residence
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-[17px] font-semibold leading-snug">
                {answerUi.label} for {passportPhrase(nationality)}
                {residence ? ` resident in ${withArticle(residence)}` : ''}.
              </p>
              {answer.note ? <p className="mt-2 text-sm leading-relaxed">{answer.note}</p> : null}
              {answer.maxStayDays ? (
                <p className="mt-2 text-sm">Maximum stay: {answer.maxStayDays} days.</p>
              ) : null}
            </div>
          ) : null}

          <h2 className="mt-10 text-xl font-bold text-gray-900">
            Who needs a visa for {name}?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Every nationality, resolved against the current rule. {rows.length} passports listed
            {residence ? `, with your ${withArticle(residence)} residence applied` : ''}.
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="py-2 pr-3 font-semibold">Nationality</th>
                  <th className="py-2 pr-3 font-semibold">Requirement</th>
                  <th className="py-2 pr-8 font-semibold">Max stay</th>
                  <th className="py-2 pr-3 font-semibold sm:border-l sm:border-gray-200 sm:pl-6">
                    Nationality
                  </th>
                  <th className="py-2 pr-3 font-semibold">Requirement</th>
                  <th className="py-2 font-semibold">Max stay</th>
                </tr>
              </thead>
              <tbody>
                {pairs.map(([left, right], i) => (
                  <tr key={left.code} className="border-b border-gray-100">
                    {[left, right].map((row, side) =>
                      row ? (
                        <Fragment key={row.code}>
                          <td
                            className={`py-2 pr-3 ${side === 1 ? 'sm:border-l sm:border-gray-100 sm:pl-6' : ''} ${
                              row.code === nationality
                                ? 'bg-primary-50/70 font-semibold text-gray-900'
                                : 'text-gray-700'
                            }`}
                          >
                            {row.name}
                          </td>
                          <td className={`py-2 pr-3 ${row.code === nationality ? 'bg-primary-50/70' : ''}`}>
                            <span
                              className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${PILL[ui(row.outcome).tone]}`}
                            >
                              {ui(row.outcome).label}
                            </span>
                          </td>
                          <td
                            className={`py-2 ${side === 0 ? 'pr-8' : ''} tabular-nums text-gray-600 ${
                              row.code === nationality ? 'bg-primary-50/70' : ''
                            }`}
                          >
                            {row.maxStayDays ? `${row.maxStayDays} days` : '\u2014'}
                          </td>
                        </Fragment>
                      ) : (
                        <Fragment key={`pad-${i}`}>
                          <td /><td /><td />
                        </Fragment>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rule.residenceOverrides?.length ? (
            <div className="mt-8 rounded-r-xl border border-l-[3px] border-gray-200 border-l-primary-700 bg-primary-50/60 px-5 py-4">
              <p className="text-sm font-semibold text-gray-900">
                If you live in {withArticle(DEFAULT_COUNTRY.code)}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                {rule.residenceOverrides.find((o) => o.residence === DEFAULT_COUNTRY.code)?.note ||
                  `Residence does not change whether you need a visa for ${name}, but it decides where you apply. Applications are filed from ${DEFAULT_COUNTRY.hub} rather than your country of nationality.`}
              </p>
            </div>
          ) : null}

          {rule.generalNotes ? (
            <p className="mt-6 text-sm leading-relaxed text-gray-500">{rule.generalNotes}</p>
          ) : null}

          <p className="mt-8 border-t border-dashed border-gray-200 pt-4 font-mono text-xs text-gray-400">
            {rule.officialSourceUrl ? (
              <>
                Source{' '}
                <a
                  href={rule.officialSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-700 underline underline-offset-2"
                >
                  {rule.officialSourceName || 'official government site'}
                </a>
              </>
            ) : null}
            {verified ? <span className="ml-4">Last checked {verified}</span> : null}
          </p>

          {rule.isServiced && rule.visaSlug ? (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-gray-900 px-5 py-4 text-white">
              <p className="max-w-md text-sm leading-relaxed text-gray-300">
                Applying from the UAE? We prepare the file, check every document against current
                requirements and book the appointment.
              </p>
              <Link
                href={`/${DEFAULT_COUNTRY.slug}/visa/${rule.visaSlug}`}
                className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary-700"
              >
                See what&apos;s included
              </Link>
            </div>
          ) : (
            <p className="mt-8 text-sm text-gray-500">
              We do not currently file {rule.destinationName} applications.{' '}
              <Link href="/uae" className="text-primary-700 underline underline-offset-2">
                See the destinations we handle
              </Link>
              .
            </p>
          )}
        </Container>
      </PrimarySection>
    </>
  );
}
