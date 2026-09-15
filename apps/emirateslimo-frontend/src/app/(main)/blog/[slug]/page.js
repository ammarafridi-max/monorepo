import { notFound } from 'next/navigation';
import {
  blogPostMetadata,
  blogPostStaticParams,
  buildBlogPostSchema,
  loadBlogPost,
} from '@travel-suite/frontend-shared/services/blogPost';
import BlogPostPage from '@travel-suite/frontend-shared/pages/client/BlogPostPage';
import * as schema from '@/lib/schema';
import { getBlogOffers, getBlogInlineOffer } from '@/config/blogOffers';

const { SITE_URL } = schema;

// Nothing on this route's ancestor chain (including app/loading.js) may define a
// loading.js. A loading.js opens a Suspense boundary, so Next flushes the HTML
// shell with a 200 before this component runs and notFound() can no longer set
// the status, which turns bad slugs into indexable soft 404s.
export const revalidate = 300;

export const generateStaticParams = blogPostStaticParams;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return blogPostMetadata({ slug, siteUrl: SITE_URL, fallbackImage: `${SITE_URL}/hero-bg.webp` });
}

export default async function Page({ params }) {
  const { slug } = await params;
  const { blog, recentPosts, relatedPosts, allBlogTags } = await loadBlogPost(slug);
  if (!blog) notFound();

  const { canonical, breadcrumbPaths, graph, breadcrumbJsonLd } = buildBlogPostSchema({
    schema,
    siteUrl: SITE_URL,
    blog,
    slug,
  });

  return (
    <BlogPostPage
      blog={blog}
      recentPosts={recentPosts}
      relatedPosts={relatedPosts}
      allBlogTags={allBlogTags}
      offers={getBlogOffers(blog)}
      inlineOffer={getBlogInlineOffer(blog)}
      canonical={canonical}
      siteUrl={SITE_URL}
      graph={graph}
      breadcrumbJsonLd={breadcrumbJsonLd}
      breadcrumbPaths={breadcrumbPaths}
    />
  );
}
