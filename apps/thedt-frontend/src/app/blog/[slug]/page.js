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

const TAG_PRIORITY = ['Dummy Ticket', 'Flight Itinerary', 'Schengen Visa', 'Travel Insurance', 'Visa Documents'];

export const revalidate = 300;

export const generateStaticParams = blogPostStaticParams;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return blogPostMetadata({ slug, siteUrl: SITE_URL });
}

export default async function Page({ params }) {
  const { slug } = await params;
  const { blog, recentPosts, relatedPosts, allBlogTags } = await loadBlogPost(slug, {
    tagPriority: TAG_PRIORITY,
  });
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
