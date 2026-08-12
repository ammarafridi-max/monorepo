import { notFound } from "next/navigation";
import { nullOn404 } from '@travel-suite/frontend-shared/services/apiClient';
import {
  getBlogBySlugApi,
  getPublishedBlogsApi,
} from "@travel-suite/frontend-shared/services/apiBlog";
import { getBlogTagsApi } from "@travel-suite/frontend-shared/services/apiBlogTags";
import {
  SITE_URL,
  buildBlogPosting,
  buildBreadcrumbList,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from "@/lib/schema";
import BlogPostPage from "@travel-suite/frontend-shared/pages/client/BlogPostPage";

// Nothing on this route's ancestor chain (including app/loading.js) may define a
// loading.js. A loading.js opens a Suspense boundary, so Next flushes the HTML
// shell with a 200 before this component runs and notFound() can no longer set
// the status — that is what turned bad slugs into indexable soft 404s.
export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const data = await getPublishedBlogsApi({ page: 1, limit: 1000 });
    const blogs = data?.blogs || [];
    return blogs
      .map((blog) => blog?.slug)
      .filter(Boolean)
      .map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await getBlogBySlugApi(slug).catch(nullOn404);

  if (!blog) {
    return {
      title: "Blog Post Not Found",
      robots: { index: false, follow: false },
    };
  }

  const title = blog.metaTitle || blog.title || "Blog Post";
  const description =
    blog.metaDescription ||
    blog.excerpt ||
    "Read the latest post from Dummy Ticket 365.";
  const canonical = `${SITE_URL}/blog/${blog.slug || slug}`;
  const image = blog.coverImageUrl || `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: { type: "article", url: canonical, title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
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

  const recentPosts = (recentData?.blogs || [])
    .filter((item) => item?._id !== blog?._id)
    .sort((a, b) => new Date(b?.publishedAt || b?.createdAt || 0) - new Date(a?.publishedAt || a?.createdAt || 0))
    .slice(0, 3);

  const title = blog.metaTitle || blog.title || "Blog Post";
  const description =
    blog.metaDescription ||
    blog.excerpt ||
    "Read the latest post from Dummy Ticket 365.";
  const canonical = `${SITE_URL}/blog/${blog.slug || slug}`;
  const faqs = blog.faqs || [];

  const breadcrumbPaths = [
    { label: "Home", path: "/" },
    { label: "Blog", path: "/blog" },
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

  const breadcrumbJsonLd = buildBreadcrumbList({ paths: breadcrumbPaths });

  return (
    <BlogPostPage
      blog={blog}
      recentPosts={recentPosts}
      allBlogTags={allBlogTags}
      canonical={canonical}
      siteUrl={SITE_URL}
      graph={graph}
      breadcrumbJsonLd={breadcrumbJsonLd}
      breadcrumbPaths={breadcrumbPaths}
    />
  );
}
