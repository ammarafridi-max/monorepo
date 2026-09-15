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

// One tag's posts, rendered by the shared BlogTagDetailPage. The shared post page
// links every tag chip here, so this route has to exist or every post carries a
// 404. Same rules as the post route: no loading.js anywhere above this, so an
// unknown slug is a real 404 and not an indexable soft one.

const describe = (tag) =>
  tag.metaDescription ||
  tag.description ||
  `Guides and tips about ${tag.name.toLowerCase()} from Picturesk, the AI headshot generator.`;

// Rendered per request, never prerendered. The (site) layout reads the session
// cookie, so nothing under it can be static; a route that also exported
// generateStaticParams + revalidate promised a static page and then hit that
// cookie on its first on-demand render, which is a DYNAMIC_SERVER_USAGE 500 in
// production. The api responses are still cached through each fetch's own
// `next.revalidate`, so the cost is the render, not the network.
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

  // Crumbs start at the product page: "/" only redirects there.
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
