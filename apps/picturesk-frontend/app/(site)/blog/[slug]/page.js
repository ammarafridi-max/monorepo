import { notFound } from 'next/navigation';
import {
  blogPostMetadata,
  buildBlogPostSchema,
  loadBlogPost,
} from '@travel-suite/frontend-shared/services/blogPost';
import BlogPostPage from '@travel-suite/frontend-shared/pages/client/BlogPostPage';
import * as schema from '../../../../lib/schema';

// One blog post, rendered by the SHARED client BlogPostPage (article, chip nav,
// author box, share buttons, related posts). No offers are passed: those render a
// travel product rail, and Picturesk sells one thing, which the closing CTA on
// every marketing page already points at.
//
// Nothing on this route's ancestor chain may define a loading.js. A loading.js
// opens a Suspense boundary, so Next flushes the HTML shell with a 200 before this
// component runs and notFound() can no longer set the status, which turns bad
// slugs into indexable soft 404s.

const { SITE_URL } = schema;

// Rendered per request, never prerendered. The (site) layout reads the session
// cookie, so nothing under it can be static; a route that also exported
// generateStaticParams + revalidate promised a static page and then hit that
// cookie on its first on-demand render, which is a DYNAMIC_SERVER_USAGE 500 in
// production. The api responses are still cached through each fetch's own
// `next.revalidate`, so the cost is the render, not the network.
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
