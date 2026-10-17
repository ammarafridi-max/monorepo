import { notFound } from 'next/navigation';
import { nullOn404 } from '@travel-suite/frontend-shared/services/apiClient';
import { getPublishedBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import { getBlogTagBySlugApi } from '@travel-suite/frontend-shared/services/apiBlogTags';
import BlogTagDetailPage from '@travel-suite/frontend-shared/pages/client/BlogTagDetailPage';
import {
  SITE_URL,
  buildBreadcrumbList,
  buildCollectionPage,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '../../../../../lib/schema';


const describe = (tag) =>
  tag.metaDescription ||
  tag.description ||
  `Guides and tips about ${tag.name.toLowerCase()} from Picturesk, the AI headshot generator.`;

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tag = await getBlogTagBySlugApi(slug).catch(nullOn404);
  if (!tag) return { title: 'Tag not found. Picturesk.ai', robots: { index: false, follow: false } };

  const title = tag.metaTitle || `${tag.name} | Picturesk Blog`;
  const description = describe(tag);
  const canonical = `${SITE_URL}/blog/tags/${tag.slug || slug}`;
  const image = `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: { type: 'website', url: canonical, title, description, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function Page({ params, searchParams }) {
  const { slug } = await params;
  const resolved = await searchParams;
  const currentPage = Math.max(1, Number(resolved?.page || 1) || 1);

  const tag = await getBlogTagBySlugApi(slug).catch(nullOn404);
  if (!tag) notFound();

  const data = await getPublishedBlogsApi({ page: currentPage, limit: 9, tag: tag.slug }).catch(
    () => ({ blogs: [], pagination: null })
  );
  const blogs = data?.blogs || [];

  const title = tag.metaTitle || `${tag.name} | Picturesk Blog`;
  const description = describe(tag);
  const canonical = `${SITE_URL}/blog/tags/${tag.slug || slug}`;

  const breadcrumbPaths = [
    { label: 'AI Headshot Generator', path: '/ai-headshot-generator' },
    { label: 'Blog', path: '/blog' },
    { label: tag.name, path: `/blog/tags/${tag.slug || slug}` },
  ];

  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical, title, description }),
    buildCollectionPage({
      canonical,
      title,
      description,
      items: blogs
        .filter((post) => post?.slug)
        .map((post) => ({ url: `${SITE_URL}/blog/${post.slug}`, name: post.title })),
    }),
  ]);

  return (
    <main className="shared-ui blogpage">
      <BlogTagDetailPage
        tag={tag}
        blogs={blogs}
        pagination={data?.pagination || null}
        currentPage={currentPage}
        breadcrumbPaths={breadcrumbPaths}
        graph={graph}
        breadcrumbJsonLd={buildBreadcrumbList({ paths: breadcrumbPaths })}
      />
    </main>
  );
}
