import { notFound } from 'next/navigation';
import {
  getPublicVisasApi,
  getPublicVisaBySlugApi,
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

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const data = await getPublicVisasApi();
    const visas = Array.isArray(data) ? data : data?.visas || [];
    return visas
      .map((visa) => visa?.slug)
      .filter(Boolean)
      .map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const visa = await getPublicVisaBySlugApi(slug).catch(() => null);

  if (!visa) {
    return {
      title: 'Visa Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title =
    visa.metaTitle || `${visa.countryName} visa for UAE residents | Travl`;
  const description =
    visa.metaDescription ||
    visa.heroSubheadline ||
    `Apply for your ${visa.countryName} visa with expert assistance from Travl. Document preparation, appointment booking, and end-to-end support.`;
  const canonical = `${SITE_URL}/visa/${visa.slug || slug}`;
  const image = visa.heroImageUrl || `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      url: canonical,
      title,
      description,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;

  const visa = await getPublicVisaBySlugApi(slug).catch(() => null);

  if (!visa) notFound();

  const title =
    visa.metaTitle || `${visa.countryName} visa for UAE residents | Travl`;
  const description =
    visa.metaDescription ||
    visa.heroSubheadline ||
    `Apply for your ${visa.countryName} visa with expert assistance from Travl. Document preparation, appointment booking, and end-to-end support.`;
  const canonical = `${SITE_URL}/visa/${visa.slug || slug}`;
  const faqs = visa.faqs || [];

  const breadcrumbPaths = [
    { label: 'Home', path: '/' },
    { label: 'Visa', path: '/visa' },
    { label: `${visa.countryName} Visa`, path: `/visa/${visa.slug || slug}` },
  ];

  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical, title, description }),
    buildService({
      canonical,
      name: `${visa.countryName} Visa Assistance`,
      description,
      areaServed: 'AE',
    }),
    ...(faqs.length > 0
      ? [buildFAQPage({ canonical, title: `${visa.countryName} Visa FAQs`, description, faqs })]
      : []),
  ]);

  const breadcrumbJsonLd = buildBreadcrumbList({ paths: breadcrumbPaths });

  return (
    <VisaDetailPage
      visa={visa}
      graph={graph}
      breadcrumbJsonLd={breadcrumbJsonLd}
      breadcrumbPaths={breadcrumbPaths}
    />
  );
}
