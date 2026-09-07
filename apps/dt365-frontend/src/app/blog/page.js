import { notFound } from 'next/navigation';
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
  title: 'Dummy Ticket & Visa Travel Blog | Tips, Guides & Updates',
  description:
    'Read practical visa travel guides, dummy ticket tips, and latest updates to prepare stronger documentation for your next application.',
  canonical: `${SITE_URL}/blog`,
};

const hero = {
  title: 'Dummy Ticket and Visa Travel Blog',
  subtitle:
    'Our blog covers everything you need to know about dummy tickets, including how they work, when to use them, and why they are commonly required for visa and immigration purposes. We also share tips, updates, and best practices to help you avoid mistakes and apply with confidence.',
};

const breadcrumbPaths = [
  { label: 'Home', path: '/' },
  { label: 'Blog', path: '/blog' },
];

// Page 2+ self-canonicalises. Canonicalising them all to /blog told Google the
// deeper pages were duplicates, which discouraged crawling the older posts.
export async function generateMetadata({ searchParams }) {
  const resolved = await searchParams;
  const page = Math.max(1, Number(resolved?.page || 1) || 1);
  const canonical = page > 1 ? `${meta.canonical}?page=${page}` : meta.canonical;
  const title = page > 1 ? `${meta.title} | Page ${page}` : meta.title;

  return {
    title,
    description: meta.description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      url: canonical,
      title,
      description: meta.description,
      images: [`${SITE_URL}/og-image.png`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: meta.description,
      images: [`${SITE_URL}/og-image.png`],
    },
  };
}

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
    // API unreachable at build time, ISR will populate on first request
  }

  // Without this any ?page=N returns 200, leaving an unbounded crawlable param space.
  if (pagination && pagination.totalPages > 0 && currentPage > pagination.totalPages) {
    notFound();
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
