import { getPublishedBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import {
  SITE_URL,
  buildBlog,
  buildBreadcrumbList,
  buildGraph,
  buildMetadata,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import BlogPage from '@travel-suite/frontend-shared/pages/client/BlogPage';

const meta = {
  title: 'Blog | Emirates Limo',
  description:
    'Read travel tips, Dubai guides, and chauffeur service insights from Emirates Limo, your luxury transport provider in Dubai and Abu Dhabi.',
  canonical: `${SITE_URL}/blog`,
};

const hero = {
  title: 'Blog',
  subtitle: 'Travel guides, Dubai destination tips, chauffeur service advice, and the latest news from Emirates Limo.',
};

const breadcrumbPaths = [
  { label: 'Home', path: '/' },
  { label: 'Blog', path: '/blog' },
];

const pageNumberFrom = (searchParams) => Math.max(1, Number(searchParams?.page || 1) || 1);

// Paginated listings must be self-canonical, otherwise page 2+ reads as a duplicate of /blog.
const canonicalForPage = (page) => (page > 1 ? `${meta.canonical}?page=${page}` : meta.canonical);

export async function generateMetadata({ searchParams }) {
  const page = pageNumberFrom(await searchParams);
  return buildMetadata({
    title: page > 1 ? `${meta.title} | Page ${page}` : meta.title,
    description: meta.description,
    canonical: canonicalForPage(page),
  });
}

export const revalidate = 3600;

export default async function Page({ searchParams }) {
  const currentPage = pageNumberFrom(await searchParams);

  let blogs = [];
  let pagination = null;
  try {
    const data = await getPublishedBlogsApi({ page: currentPage, limit: 15 });
    blogs = data?.blogs || [];
    pagination = data?.pagination || null;
  } catch {}

  const canonical = canonicalForPage(currentPage);
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
