import {
  SITE_URL,
  buildBreadcrumbList,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildProduct,
  buildWebPage,
  buildWebsite,
} from './schema';

const FUNNEL = '/ai-headshot-generator/select';

/**
 * Metadata and the JSON-LD graph for a keyword landing page, built from the page's
 * own `meta` and `sections`. Every landing page gets the same treatment, so a new
 * page cannot ship without a canonical, an OG card, a Product node or breadcrumbs.
 *
 * Breadcrumbs start at /ai-headshot-generator, the canonical home of the product.
 * "/" only redirects there, so a crumb pointing at it would send crawlers through
 * a 308 on every page.
 */
export function landingMetadata({ meta }) {
  const canonical = `${SITE_URL}${meta.canonical}`;
  const image = `${SITE_URL}/og-image.png`;

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      url: canonical,
      title: meta.title,
      description: meta.description,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [image],
    },
  };
}

export function landingSchema({ meta, sections, productName }) {
  const canonical = `${SITE_URL}${meta.canonical}`;
  const faqs = sections.faq?.faqs ?? [];
  const { '@context': _c, ...breadcrumb } = buildBreadcrumbList({
    paths: [
      { label: 'AI Headshot Generator', path: '/ai-headshot-generator' },
      { label: meta.breadcrumb, path: meta.canonical },
    ],
  });

  return buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical, title: meta.title, description: meta.description }),
    buildProduct({
      canonical,
      name: productName,
      description: meta.description,
      price: '9',
    }),
    breadcrumb,
    ...(faqs.length
      ? [
          buildFAQPage({
            canonical,
            title: sections.faq.title,
            description: meta.description,
            faqs: faqs.map((f) => ({ question: f.q, answer: f.a })),
          }),
        ]
      : []),
  ]);
}

export { FUNNEL };
