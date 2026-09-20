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
const DATING_FUNNEL = '/ai-dating-photos/select';

// The canonical page each family of landing pages breadcrumbs from.
export const ROOTS = {
  headshots: { label: 'AI Headshot Generator', path: '/ai-headshot-generator' },
  dating: { label: 'AI Dating Photos', path: '/ai-dating-photos' },
};

/**
 * Metadata and the JSON-LD graph for a keyword landing page, built from the page's
 * own `meta` and `sections`. Every landing page gets the same treatment, so a new
 * page cannot ship without a canonical, an OG card, a Product node or breadcrumbs.
 *
 * Breadcrumbs run Home -> product root -> page, so every landing page hangs off
 * its product and the product off the hub.
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

export function landingSchema({ meta, sections, productName, root = ROOTS.headshots, price = '9' }) {
  const canonical = `${SITE_URL}${meta.canonical}`;
  const faqs = sections.faq?.faqs ?? [];
  const crumbs = [{ label: 'Home', path: '/' }, { label: root.label, path: root.path }];
  if (meta.canonical !== root.path) crumbs.push({ label: meta.breadcrumb, path: meta.canonical });
  const { '@context': _c, ...breadcrumb } = buildBreadcrumbList({ paths: crumbs });

  return buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical, title: meta.title, description: meta.description }),
    buildProduct({
      canonical,
      name: productName,
      description: meta.description,
      price,
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

export { FUNNEL, DATING_FUNNEL };
