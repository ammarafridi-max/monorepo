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
  title: 'Travel Insurance Guides for UAE Residents | Travl Blog',
  description:
    'Plain-English guides on travel insurance for UAE residents: what Schengen and UK visas require, what AXA policies cover, how claims work, and what you will pay.',
  canonical: `${SITE_URL}/blog`,
};

const hero = {
  title: 'Travel Insurance Guides',
  subtitle:
    'What travel insurance covers, what it costs from the UAE, what consulates ask for, and how to claim when something goes wrong. Written for UAE residents, updated as the rules change.',
  points: ['Coverage Explained', 'Visa Requirements', 'Claims Guides', 'Destination Cover'],
};

const breadcrumbPaths = [
  { label: 'Home', path: '/' },
  { label: 'Blog', path: '/blog' },
];

const pageNumberFrom = (searchParams) =>
  Math.max(1, Number(searchParams?.page || 1) || 1);

// Paginated listings must be self-canonical. Pointing page 2+ at /blog told
// Google they were duplicates and suppressed the posts only reachable there.
const canonicalForPage = (page) =>
  page > 1 ? `${meta.canonical}?page=${page}` : meta.canonical;

export async function generateMetadata({ searchParams }) {
  const page = pageNumberFrom(await searchParams);
  const canonical = canonicalForPage(page);
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
  const currentPage = pageNumberFrom(resolvedSearchParams);
  const canonical = canonicalForPage(currentPage);

  let blogs = [];
  let pagination = null;
  try {
    const data = await getPublishedBlogsApi({ page: currentPage, limit: 15 });
    blogs = data?.blogs || [];
    pagination = data?.pagination || null;
  } catch {

  }

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical, title: meta.title, description: meta.description }),
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
