import { notFound } from 'next/navigation';
import { nullOn404 } from '@travel-suite/frontend-shared/services/apiClient';
import {
  getBlogBySlugApi,
  getPublishedBlogsApi,
} from '@travel-suite/frontend-shared/services/apiBlog';
import { getBlogTagsApi } from '@travel-suite/frontend-shared/services/apiBlogTags';
import BlogPostPage from '@travel-suite/frontend-shared/pages/client/BlogPostPage';
import {
  SITE_URL,
  buildBlogPosting,
  buildBreadcrumbList,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '../../../../lib/schema';

// One blog post, rendered by the SHARED client BlogPostPage (article, chip nav,
// author box, share buttons, related posts). No offers are passed: those render a
// travel product rail, and Picturesk sells one thing, which the closing CTA on
// every marketing page already points at.
//
// Nothing on this route's ancestor chain may define a loading.js. A loading.js
// opens a Suspense boundary, so Next flushes the HTML shell with a 200 before this
// component runs and notFound() can no longer set the status, which turns bad
// slugs into indexable soft 404s.
export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const data = await getPublishedBlogsApi({ page: 1, limit: 1000 });
    return (data?.blogs || [])
      .map((blog) => blog?.slug)
      .filter(Boolean)
      .map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

const FALLBACK_DESCRIPTION =
  'A practical guide to getting professional AI headshots from your own selfies.';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await getBlogBySlugApi(slug).catch(nullOn404);

  if (!blog) {
    return { title: 'Post not found. Picturesk.ai', robots: { index: false, follow: false } };
  }

  const title = blog.metaTitle || blog.title || 'Blog post';
  const description = blog.metaDescription || blog.excerpt || FALLBACK_DESCRIPTION;
  const canonical = `${SITE_URL}/blog/${blog.slug || slug}`;
  const image = blog.coverImageUrl || `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: { type: 'article', url: canonical, title, description, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;

  const [blog, recentData, allBlogTags] = await Promise.all([
    getBlogBySlugApi(slug).catch(nullOn404),
    getPublishedBlogsApi({ page: 1, limit: 20 }).catch(() => ({ blogs: [] })),
    getBlogTagsApi().catch(() => []),
  ]);

  if (!blog) notFound();

  const pool = recentData?.blogs || [];
  const recentPosts = pool
    .filter((item) => item?._id !== blog?._id)
    .sort(
      (a, b) =>
        new Date(b?.publishedAt || b?.createdAt || 0) -
        new Date(a?.publishedAt || a?.createdAt || 0)
    )
    .slice(0, 3);
  const relatedPosts = await getRelatedPosts(blog, pool);

  const title = blog.metaTitle || blog.title || 'Blog post';
  const description = blog.metaDescription || blog.excerpt || FALLBACK_DESCRIPTION;
  const canonical = `${SITE_URL}/blog/${blog.slug || slug}`;
  const faqs = blog.faqs || [];

  const breadcrumbPaths = [
    { label: 'Home', path: '/' },
    { label: 'Blog', path: '/blog' },
    { label: blog.title, path: `/blog/${blog.slug || slug}` },
  ];

  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical, title, description }),
    buildBlogPosting({
      canonical,
      title: blog.title,
      description: blog.excerpt || description,
      image: blog.coverImageUrl,
      datePublished: blog.publishedAt,
      dateModified: blog.updatedAt,
      authorName: blog.author?.name,
    }),
    ...(faqs.length > 0
      ? [buildFAQPage({ canonical, title: `${blog.title} FAQs`, description, faqs })]
      : []),
  ]);

  return (
    <main className="shared-ui blogpage">
      <BlogPostPage
        blog={blog}
        recentPosts={recentPosts}
        relatedPosts={relatedPosts}
        allBlogTags={allBlogTags}
        canonical={canonical}
        siteUrl={SITE_URL}
        graph={graph}
        breadcrumbJsonLd={buildBreadcrumbList({ paths: breadcrumbPaths })}
        breadcrumbPaths={breadcrumbPaths}
      />
    </main>
  );
}

// Further reading is matched on the post's own tags, falling back to recent posts
// so the row is never half-empty.
async function getRelatedPosts(blog, fallbackPool = []) {
  const tags = (Array.isArray(blog?.tags) ? blog.tags : [])
    .map((t) => (typeof t === 'string' ? { name: t, slug: t } : t))
    .filter((t) => t?.name);
  const primary = tags[0] || null;
  const primaryTag = primary ? primary.slug || primary.name : null;

  let pool = [];
  if (primaryTag) {
    const data = await getPublishedBlogsApi({ page: 1, limit: 12, tag: primaryTag }).catch(() => ({
      blogs: [],
    }));
    pool = data?.blogs || [];
  }

  const seen = new Set([String(blog?._id)]);
  const picked = [];
  for (const candidate of [...pool, ...fallbackPool]) {
    const id = String(candidate?._id || '');
    if (!id || seen.has(id)) continue;
    seen.add(id);
    picked.push(candidate);
    if (picked.length === 3) break;
  }
  return picked;
}
