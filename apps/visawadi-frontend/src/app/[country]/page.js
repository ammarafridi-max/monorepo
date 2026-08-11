import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import VisaCard from '@travel-suite/frontend-shared/components/cards/VisaCard';
import VisaCheckerInline from '@travel-suite/frontend-shared/components/ui/v2/VisaCheckerInline';
import { getPublicVisasForResidenceApi } from '@travel-suite/frontend-shared/services/apiVisa';
import {
  SITE_URL,
  buildBreadcrumbList,
  buildGraph,
  buildOrganization,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import { LIVE_COUNTRIES, countryBySlug } from '@/config/countries';
import { EMAIL } from '@/config/contact';

export const revalidate = 300;

/**
 * A root-level [country] segment matches every unmatched top-level path, so
 * without this /anything-at-all would resolve here and we'd be hand-rolling
 * 404s for the whole site. The country list is finite and lives in config, so
 * pinning the params to it lets the router 404 properly for everything else.
 */
export const dynamicParams = false;

/** Only live countries get a route. An unlaunched one 404s rather than
 *  rendering an empty hub. */
export function generateStaticParams() {
  return LIVE_COUNTRIES.map((c) => ({ country: c.slug }));
}

function metaFor(c) {
  return {
    title: `Visa Assistance for ${c.residents}`,
    description: `Visa application support for ${c.residents}. We review every document against current embassy requirements, prepare the file and book your appointment in ${c.hub}.`,
    canonical: `${SITE_URL}/${c.slug}`,
  };
}

export async function generateMetadata({ params }) {
  const { country } = await params;
  const c = countryBySlug(country);
  if (!c?.isLive) return { title: 'Not found', robots: { index: false, follow: false } };
  const m = metaFor(c);
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: m.canonical },
    robots: { index: true, follow: true },
    openGraph: { url: m.canonical, title: m.title, description: m.description },
  };
}

export default async function Page({ params }) {
  const { country } = await params;
  const c = countryBySlug(country);
  if (!c?.isLive) notFound();

  const res = await getPublicVisasForResidenceApi(c.code).catch(() => null);
  const visas = Array.isArray(res) ? res : res?.data || [];

  const m = metaFor(c);
  const breadcrumbPaths = [
    { label: 'Home', path: '/' },
    { label: c.short, path: `/${c.slug}` },
  ];
  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical: m.canonical, title: m.title, description: m.description }),
    buildService({
      canonical: m.canonical,
      name: `Visa Assistance for ${c.residents}`,
      description: m.description,
      areaServed: c.code,
    }),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbList({ paths: breadcrumbPaths })) }} />

      <PrimarySection className="bg-gray-900 py-14 text-white md:py-20">
        <Container>
          <div className="max-w-3xl lg:mx-auto lg:text-center">
            <h1 className="text-3xl font-bold leading-tight md:text-4xl xl:text-5xl">
              Visa Assistance for {c.residents}
            </h1>
            <p className="mt-5 leading-relaxed text-gray-300 lg:mx-auto">
              Most refusals come from document errors that were preventable. Our specialists build your
              application, check every page, and file it in {c.hub}.
            </p>
          </div>
          <div className="relative mt-9 max-w-4xl lg:mx-auto">
            <VisaCheckerInline />
          </div>
        </Container>
      </PrimarySection>

      <PrimarySection className="py-14 md:py-20">
        <Container>
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
              Visas We Handle from the {c.short}
            </h2>
            <p className="mt-3 leading-relaxed text-gray-500">
              Every package includes document review, file preparation and appointment booking, with
              fees shown in {c.currency} before you commit.
            </p>
          </div>

          {visas.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visas.map((visa) => (
                <VisaCard key={visa.slug} visa={visa} href={`/${c.slug}/visa/${visa.slug}`} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              We are still preparing our {c.short} pages.{' '}
              <a href={`mailto:${EMAIL}`} className="font-semibold text-primary-700 hover:underline">
                Email us
              </a>{' '}
              and we will tell you what your application needs.
            </p>
          )}

          <div className="mt-10">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
            >
              Not sure which one you need? Talk to us <ArrowRight size={15} />
            </Link>
          </div>
        </Container>
      </PrimarySection>
    </>
  );
}
