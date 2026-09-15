import { nullOn404 } from './apiClient.js';
import { getBlogBySlugApi, getPublishedBlogsApi } from './apiBlog.js';
import { getBlogTagsApi } from './apiBlogTags.js';
import { buildMetadata } from '../utils/publicMetadata.js';
import { buildBreadcrumbList, buildFAQPage, buildGraph } from '../utils/schema.js';

const byNewest = (a, b) =>
  new Date(b?.publishedAt || b?.createdAt || 0) - new Date(a?.publishedAt || a?.createdAt || 0);

const tagName = (t) => (typeof t === 'string' ? t : t?.name);
const tagSlug = (t) => (typeof t === 'string' ? t : t?.slug || t?.name);

export async function blogPostStaticParams() {
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

// Related posts are matched on the post's own tags. Tags are broad, so a brand
// can pass `tagPriority` to prefer its most specific ones; otherwise the first
// tag wins. Recent posts pad the grid so it is never half-empty.
async function getRelatedPosts(blog, fallbackPool, tagPriority) {
  const tags = (Array.isArray(blog?.tags) ? blog.tags : []).filter(tagName);
  const primary = tags.find((t) => tagPriority.includes(tagName(t))) || tags[0] || null;

  let pool = [];
  if (primary) {
    const data = await getPublishedBlogsApi({ page: 1, limit: 12, tag: tagSlug(primary) }).catch(() => ({
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

export async function loadBlogPost(slug, { tagPriority = [] } = {}) {
  const [blog, recentData, allBlogTags] = await Promise.all([
    getBlogBySlugApi(slug).catch(nullOn404),
    getPublishedBlogsApi({ page: 1, limit: 20 }).catch(() => ({ blogs: [] })),
    getBlogTagsApi().catch(() => []),
  ]);

  if (!blog) return { blog: null, recentPosts: [], relatedPosts: [], allBlogTags: [] };

  const pool = (recentData?.blogs || []).filter((item) => item?._id !== blog._id);
  const recentPosts = [...pool].sort(byNewest).slice(0, 3);
  const relatedPosts = await getRelatedPosts(blog, pool, tagPriority);

  return { blog, recentPosts, relatedPosts, allBlogTags: allBlogTags || [] };
}

export const blogPostCanonical = (siteUrl, blog, slug) => `${siteUrl}/blog/${blog?.slug || slug}`;

export async function blogPostMetadata({ slug, siteUrl, fallbackImage = `${siteUrl}/og-image.png` }) {
  const blog = await getBlogBySlugApi(slug).catch(nullOn404);
  if (!blog) {
    return { title: 'Blog Post Not Found', robots: { index: false, follow: false } };
  }
  return buildMetadata({
    siteUrl,
    title: blog.metaTitle || blog.title || 'Blog Post',
    description: blog.metaDescription || blog.excerpt,
    canonical: blogPostCanonical(siteUrl, blog, slug),
    images: [blog.coverImageUrl || fallbackImage],
    type: 'article',
  });
}

/**
 * `schema` is the brand's lib/schema module: the builders come from
 * createSchemaBuilders, so a brand that overrides one (Emirates Limo adds
 * LocalBusiness fields to its Organization) keeps the override here.
 */
export function buildBlogPostSchema({ schema, siteUrl, blog, slug }) {
  const canonical = blogPostCanonical(siteUrl, blog, slug);
  const title = blog.metaTitle || blog.title || 'Blog Post';
  const description = blog.metaDescription || blog.excerpt;
  const faqs = blog.faqs || [];
  const profile = blog.author?.authorProfile;

  const breadcrumbPaths = [
    { label: 'Home', path: '/' },
    { label: 'Blog', path: '/blog' },
    { label: blog.title, path: `/blog/${blog.slug || slug}` },
  ];

  const graph = buildGraph([
    schema.buildOrganization(),
    schema.buildWebsite(),
    schema.buildWebPage({ canonical, title, description }),
    schema.buildBlogPosting({
      canonical,
      title: blog.title,
      description: blog.excerpt || description,
      image: blog.coverImageUrl,
      datePublished: blog.publishedAt,
      dateModified: blog.updatedAt,
      authorName: blog.author?.name,
      authorSlug: profile?.slug,
    }),
    ...(profile?.slug
      ? [
          schema.buildPerson({
            name: blog.author.name,
            slug: profile.slug,
            jobTitle: profile.jobTitle,
            bio: profile.bio,
            image: profile.avatarUrl,
            sameAs: profile.sameAs,
            expertise: profile.expertise,
          }),
        ]
      : []),
    ...(faqs.length > 0 ? [buildFAQPage({ canonical, title: `${blog.title} FAQs`, description, faqs })] : []),
  ]);

  return {
    canonical,
    breadcrumbPaths,
    graph,
    breadcrumbJsonLd: buildBreadcrumbList({ baseUrl: siteUrl, paths: breadcrumbPaths }),
  };
}
