import {
  SITE_URL,
  buildBreadcrumbList,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
  buildService,
} from '@/lib/schema';
import VisaPage from '@travel-suite/frontend-shared/pages/client/VisaPage';

const meta = {
  title: 'Visa assistance for UAE residents | Travl',
  description:
    'Expert document preparation, appointment booking, and end-to-end visa support for the destinations UAE residents apply to most. Professional service, transparent pricing.',
  canonical: `${SITE_URL}/visa`,
};

const breadcrumbPaths = [
  { label: 'Home', path: '/' },
  { label: 'Visa', path: '/visa' },
];

export const metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: meta.canonical },
  robots: { index: true, follow: true },
  openGraph: {
    url: meta.canonical,
    title: meta.title,
    description: meta.description,
    images: [`${SITE_URL}/og-image.png`],
  },
  twitter: {
    card: 'summary_large_image',
    title: meta.title,
    description: meta.description,
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default function Page() {
  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical: meta.canonical, title: meta.title, description: meta.description }),
    buildService({
      canonical: meta.canonical,
      name: 'Visa Assistance',
      description: meta.description,
    }),
  ]);
  const breadcrumbJsonLd = buildBreadcrumbList({ paths: breadcrumbPaths });

  return (
    <VisaPage
      schema={schema}
      breadcrumbJsonLd={breadcrumbJsonLd}
    />
  );
}
