import { getPublishedBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import {
  SITE_URL,
  buildBlog,
  buildBreadcrumbList,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import BlogPage from '@travel-suite/frontend-shared/pages/client/BlogPage';

const meta = {
  title: 'Travel Insurance & Visa Travel Blog | Tips, Guides & Updates',
  description:
    'Read practical visa travel guides, travel insurance tips, and updates to help you prepare stronger documentation for your next application.',
  canonical: `${SITE_URL}/blog`,
};

const hero = {
  title: 'Blog',
  subtitle:
    'Our blog covers travel insurance, visa requirements, flight reservations, and everything else you need to prepare a strong application. We share practical guides, tips, and updates to help you apply with confidence.',
};

const breadcrumbPaths = [
  { label: 'Home', path: '/' },
  { label: 'Blog', path: '/blog' },
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

export const revalidate = 3600;

export default async function Page({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, Number(resolvedSearchParams?.page || 1) || 1);

  let blogs = [];
  let pagination = null;
  try {
    const data = await getPublishedBlogsApi({ page: currentPage, limit: 9 });
    blogs = data?.blogs || [];
    pagination = data?.pagination || null;
  } catch {
    // API unreachable at build time — ISR will populate on first request
  }

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical: meta.canonical, title: meta.title, description: meta.description }),
    buildBlog({ canonical: meta.canonical, title: meta.title, description: meta.description }),
  ]);
  const breadcrumbJsonLd = buildBreadcrumbList({ paths: breadcrumbPaths });

  return (
    <BlogPage
      blogs={blogs}
      pagination={pagination}
      currentPage={currentPage}
      hero={hero}
      breadcrumbPaths={breadcrumbPaths}
      schema={schema}
      breadcrumbJsonLd={breadcrumbJsonLd}
    />
  );
}
