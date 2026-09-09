import Link from 'next/link';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import VisaCheckerInline from '@travel-suite/frontend-shared/components/ui/v2/VisaCheckerInline';
import { getVisaDestinationsApi } from '@travel-suite/frontend-shared/services/apiVisaRequirements';
import {
  SITE_URL,
  buildBreadcrumbList,
  buildCollectionPage,
  buildGraph,
  buildOrganization,
  buildWebsite,
} from '@/lib/schema';
import { DEFAULT_COUNTRY } from '@/config/countries';

export const revalidate = 3600;

const CANONICAL = `${SITE_URL}/visa-check`;

export const metadata = {
  title: 'Visa Check for UAE Residents',
  description:
    'Check whether your passport needs a visa, an e-visa or nothing at all, for 35 destinations. Every answer carries the official source it came from and the date it was checked.',
  alternates: { canonical: CANONICAL },
  robots: { index: true, follow: true },
  openGraph: {
    url: CANONICAL,
    title: 'Visa Check for UAE Residents',
    description:
      'Check whether your passport needs a visa for 35 destinations, with the official source and the date each rule was last verified.',
    images: [`${SITE_URL}/og-image.png`],
  },
  twitter: { card: 'summary_large_image', images: [`${SITE_URL}/og-image.png`] },
};

/** Schengen states share one rule set, so they read better as one block. */
const SCHENGEN = new Set([
  'AT', 'BE', 'BG', 'HR', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IT',
  'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'XS',
]);

export default async function VisaCheckIndexPage() {
  const list = await getVisaDestinationsApi().catch(() => []);
  const destinations = (list?.data || list || []).filter((d) => d?.code);

  const schengen = destinations.filter((d) => SCHENGEN.has(d.code));
  const others = destinations.filter((d) => !SCHENGEN.has(d.code));

  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildCollectionPage({
      canonical: CANONICAL,
      title: metadata.title,
      description: metadata.description,
      items: destinations.map((d) => ({
        url: `${SITE_URL}/visa-check/${d.code.toLowerCase()}`,
        name: `Do you need a visa for ${d.name}?`,
      })),
    }),
    buildBreadcrumbList({
      paths: [
        { label: 'Home', path: '/' },
        { label: 'Visa check', path: '/visa-check' },
      ],
    }),
  ]);

  const Group = ({ title, note, items }) =>
    items.length ? (
      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">{note}</p>
        <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d) => (
            <li key={d.code} className="border-b border-gray-100">
              <Link
                href={`/visa-check/${d.code.toLowerCase()}`}
                className="flex items-baseline justify-between gap-3 py-2.5 text-sm text-gray-700 transition-colors hover:text-primary-700"
              >
                <span>{d.name}</span>
                {d.isServiced ? (
                  <span className="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700">
                    We file this
                  </span>
                ) : (
                  <span className="shrink-0 font-mono text-[11px] text-gray-300">{d.code}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />

      <PrimarySection className="bg-gray-900 py-12 text-white md:py-16">
        <Container>
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
              Visa check
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
              Does your passport need a visa?
            </h1>
            <p className="mt-4 leading-relaxed text-gray-300">
              Answers for {destinations.length} destinations, built on rules we verify against the
              issuing authority rather than scraped from aggregators. Every answer shows the source
              it came from and the date it was last checked.
            </p>
          </div>
          <div className="mt-8 max-w-3xl">
            <VisaCheckerInline
              basePath={`/${DEFAULT_COUNTRY.slug}`}
              consultHref={`/${DEFAULT_COUNTRY.slug}`}
              resultPath="/visa-check"
            />
          </div>
        </Container>
      </PrimarySection>

      <PrimarySection className="py-12 md:py-16">
        <Container>
          <Group
            title="Schengen area"
            note="One visa policy covers all of these, so the answer is the same across the bloc. Which country you apply to depends on where you will spend the most nights."
            items={schengen}
          />
          <Group
            title="Other destinations"
            note="Each of these sets its own policy, so check the one you are travelling to."
            items={others}
          />

          <div className="mt-12 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
            <p className="text-sm font-semibold text-gray-900">Where these answers come from</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              Each destination has a curated rule listing the nationalities that travel visa-free,
              the ones that need an e-visa or travel authorisation, and the residence exceptions
              that change where you file. We record the official source and the date we last checked
              it on every page, so you can see how current an answer is before you rely on it.
            </p>
          </div>
        </Container>
      </PrimarySection>
    </>
  );
}
