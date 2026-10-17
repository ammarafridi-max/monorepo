import { notFound } from 'next/navigation';
import {
  blogPostMetadata,
  buildBlogPostSchema,
  loadBlogPost,
} from '@travel-suite/frontend-shared/services/blogPost';
import BlogPostPage from '@travel-suite/frontend-shared/pages/client/BlogPostPage';
import * as schema from '../../../../lib/schema';


const { SITE_URL } = schema;

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const metadata = await blogPostMetadata({ slug, siteUrl: SITE_URL, fallbackImage: `${SITE_URL}/logo.png` });
  return metadata.robots?.index === false ? { ...metadata, title: 'Post not found. Picturesk.ai' } : metadata;
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
    <main className="shared-ui blogpage">
      <BlogPostPage
        blog={blog}
        recentPosts={recentPosts}
        relatedPosts={relatedPosts}
        allBlogTags={allBlogTags}
        canonical={canonical}
        siteUrl={SITE_URL}
        graph={graph}
        breadcrumbJsonLd={breadcrumbJsonLd}
        breadcrumbPaths={breadcrumbPaths}
      />
    </main>
  );
}
