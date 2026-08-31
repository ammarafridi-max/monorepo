import { notFound } from 'next/navigation';
import { nullOn404 } from '@travel-suite/frontend-shared/services/apiClient';
import {
  getPublicVisasForResidenceApi,
  getPublicVisaForResidenceApi,
} from '@travel-suite/frontend-shared/services/apiVisa';
import {
  SITE_URL,
  buildBreadcrumbList,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import VisaDetailPage from '@travel-suite/frontend-shared/pages/client/VisaDetailPage';
import { LIVE_COUNTRIES, countryBySlug } from '@/config/countries';
import { WHATSAPP_URL } from '@/config/contact';

// Nothing on this route's ancestor chain (including app/loading.js) may define a
// loading.js. A loading.js opens a Suspense boundary, so Next flushes the HTML
// shell with a 200 before this component runs and notFound() can no longer set
// the status — that is what turned bad slugs into indexable soft 404s.
export const revalidate = 300;

/** Every live country crossed with the destinations it actually serves. A
 *  destination with no overlay for a country is not a page in that country. */
export async function generateStaticParams() {
  const params = [];
  for (const c of LIVE_COUNTRIES) {
    try {
      const res = await getPublicVisasForResidenceApi(c.code);
      const visas = Array.isArray(res) ? res : res?.data || [];
      for (const v of visas) if (v?.slug) params.push({ country: c.slug, slug: v.slug });
    } catch {
      // Backend unreachable at build time — fall back to on-demand rendering.
    }
  }
  return params;
}

async function load(countrySlug, slug) {
  const c = countryBySlug(countrySlug);
  if (!c?.isLive) return { c: null, visa: null };
  const res = await getPublicVisaForResidenceApi(slug, c.code).catch(nullOn404);
  const visa = res?.data ?? res ?? null;
  return { c, visa };
}

function copyFor(c, visa, slug) {
  const title = visa.metaTitle || `${visa.countryName} visa for ${c.residents}`;
  const description =
    visa.metaDescription ||
    visa.heroSubheadline ||
    `Apply for your ${visa.countryName} visa from the ${c.short} with expert help. Document review, file preparation and appointment booking.`;
  return { title, description, canonical: `${SITE_URL}/${c.slug}/visa/${visa.slug || slug}` };
}

export async function generateMetadata({ params }) {
  const { country, slug } = await params;
  const { c, visa } = await load(country, slug);
  if (!c || !visa) return { title: 'Visa Not Found', robots: { index: false, follow: false } };

  const { title, description, canonical } = copyFor(c, visa, slug);
  const image = visa.heroImageUrl || `${SITE_URL}/og-image.png`;
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: { url: canonical, title, description, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function Page({ params }) {
  const { country, slug } = await params;
  const { c, visa } = await load(country, slug);
  if (!c || !visa) notFound();

  const { title, description, canonical } = copyFor(c, visa, slug);
  const faqs = visa.faqs || [];

  const breadcrumbPaths = [
    { label: 'Home', path: '/' },
    { label: c.short, path: `/${c.slug}` },
    { label: `${visa.countryName} Visa`, path: `/${c.slug}/visa/${visa.slug || slug}` },
  ];

  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical, title, description }),
    buildService({
      canonical,
      name: `${visa.countryName} Visa Assistance for ${c.residents}`,
      description,
      // The audience is where the applicant lives, not where they are going.
      areaServed: c.code,
    }),
    ...(faqs.length > 0
      ? [buildFAQPage({ canonical, title: `${visa.countryName} Visa FAQs`, description, faqs })]
      : []),
  ]);

  return (
    <VisaDetailPage
      visa={visa}
      schema={graph}
      breadcrumbJsonLd={buildBreadcrumbList({ paths: breadcrumbPaths })}
      breadcrumbPaths={breadcrumbPaths}
      whatsappUrl={WHATSAPP_URL || undefined}
    />
  );
}
