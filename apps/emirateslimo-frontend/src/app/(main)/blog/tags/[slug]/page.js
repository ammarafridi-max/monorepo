import { notFound } from 'next/navigation';
import { nullOn404 } from '@travel-suite/frontend-shared/services/apiClient';
import { getPublishedBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import { getBlogTagBySlugApi, getBlogTagsApi } from '@travel-suite/frontend-shared/services/apiBlogTags';
import {
  SITE_URL,
  buildBreadcrumbList,
  buildCollectionPage,
  buildGraph,
  buildMetadata,
  buildOrganization,
  buildWebsite,
} from '@/lib/schema';
import BlogTagDetailPage from '@travel-suite/frontend-shared/pages/client/BlogTagDetailPage';

// Nothing on this route's ancestor chain may define a loading.js. A loading.js opens a
// Suspense boundary, so Next flushes a 200 shell before notFound() can set the status,
// which turns bad slugs into indexable soft 404s.
export const revalidate = 300;

const tagMeta = (tag, slug) => ({
  title: tag.metaTitle || `${tag.name} | Blog Tag | Emirates Limo`,
  description: tag.metaDescription || tag.description || `Explore published blog posts under the ${tag.name} tag.`,
  canonical: `${SITE_URL}/blog/tags/${tag.slug || slug}`,
});

export async function generateStaticParams() {
  try {
    const tags = await getBlogTagsApi();
    return (tags || [])
      .map((tag) => tag?.slug)
      .filter(Boolean)
      .map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tag = await getBlogTagBySlugApi(slug).catch(nullOn404);

  if (!tag) {
    return { title: 'Blog Tag Not Found', robots: { index: false, follow: false } };
  }

  return buildMetadata(tagMeta(tag, slug));
}

export default async function Page({ params, searchParams }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, Number(resolvedSearchParams?.page || 1) || 1);

  const tag = await getBlogTagBySlugApi(slug).catch(nullOn404);
  if (!tag) notFound();

  const data = await getPublishedBlogsApi({ page: currentPage, limit: 9, tag: tag.name }).catch(() => ({
    blogs: [],
    pagination: null,
  }));
  const blogs = data?.blogs || [];
  const pagination = data?.pagination || null;

  const { title, description, canonical } = tagMeta(tag, slug);

  const breadcrumbPaths = [
    { label: 'Home', path: '/' },
    { label: 'Blog', path: '/blog' },
    { label: 'Tags', path: '/blog/tags' },
    { label: tag.name, path: `/blog/tags/${tag.slug || slug}` },
  ];

  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildCollectionPage({
      canonical,
      title,
      description,
      items: blogs
        .filter((post) => post?.slug)
        .map((post) => ({ url: `${SITE_URL}/blog/${post.slug}`, name: post.title })),
    }),
  ]);
  const breadcrumbJsonLd = buildBreadcrumbList({ paths: breadcrumbPaths });

  return (
    <BlogTagDetailPage
      tag={tag}
      blogs={blogs}
      pagination={pagination}
      currentPage={currentPage}
      breadcrumbPaths={breadcrumbPaths}
      graph={graph}
      breadcrumbJsonLd={breadcrumbJsonLd}
    />
  );
}
