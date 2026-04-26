import { notFound } from 'next/navigation';
import { getPublishedBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import { getBlogTagBySlugApi, getBlogTagsApi } from '@travel-suite/frontend-shared/services/apiBlogTags';
import {
  SITE_URL,
  buildBlog,
  buildBreadcrumbList,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import BlogTagDetailPage from '@travel-suite/frontend-shared/pages/client/BlogTagDetailPage';

export const revalidate = 300;

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
  const tag = await getBlogTagBySlugApi(slug).catch(() => null);

  if (!tag) {
    return { title: 'Blog Tag Not Found', robots: { index: false, follow: false } };
  }

  const title = tag.metaTitle || `${tag.name} | Blog Tag | Travl`;
  const description =
    tag.metaDescription ||
    tag.description ||
    `Explore published blog posts under the ${tag.name} tag.`;
  const canonical = `${SITE_URL}/blog/tags/${tag.slug || slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: { url: canonical, title, description, images: [`${SITE_URL}/og-image.png`] },
    twitter: { card: 'summary_large_image', title, description, images: [`${SITE_URL}/og-image.png`] },
  };
}

export default async function Page({ params, searchParams }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, Number(resolvedSearchParams?.page || 1) || 1);

  const tag = await getBlogTagBySlugApi(slug).catch(() => null);
  if (!tag) notFound();

  const data = await getPublishedBlogsApi({
    page: currentPage,
    limit: 9,
    tag: tag.name,
  }).catch(() => ({ blogs: [], pagination: null }));

  const blogs = data?.blogs || [];
  const pagination = data?.pagination || null;

  const title = tag.metaTitle || `${tag.name} | Blog Tag | Travl`;
  const description =
    tag.metaDescription ||
    tag.description ||
    `Explore published blog posts under the ${tag.name} tag.`;
  const canonical = `${SITE_URL}/blog/tags/${tag.slug || slug}`;

  const breadcrumbPaths = [
    { label: 'Home', path: '/' },
    { label: 'Blog', path: '/blog' },
    { label: 'Tags', path: '/blog/tags' },
    { label: tag.name, path: `/blog/tags/${tag.slug || slug}` },
  ];

  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical, title, description }),
    buildBlog({ canonical, title, description }),
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
