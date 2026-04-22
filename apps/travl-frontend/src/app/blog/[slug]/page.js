import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogBySlugApi, getPublishedBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import { getBlogTagsApi } from '@travel-suite/frontend-shared/services/apiBlogTags';
import {
  SITE_URL,
  buildBlogPosting,
  buildBreadcrumbList,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import Container from '@travel-suite/frontend-shared/components/v1/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/v1/PrimarySection';
import FAQAccordion from '@travel-suite/frontend-shared/components/v1/FAQAccordion';
import ShareButtons from './ShareButtons';

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
  const blog = await getBlogBySlugApi(slug).catch(() => null);

  if (!blog) {
    return {
      title: 'Blog Post Not Found',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = blog.metaTitle || blog.title || 'Blog Post';
  const description =
    blog.metaDescription ||
    blog.excerpt ||
    'Read the latest post from Travl.';
  const canonical = `${SITE_URL}/blog/${blog.slug || slug}`;
  const image = blog.coverImageUrl || `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: 'article',
      url: canonical,
      title,
      description,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const [blog, recentData, allBlogTags] = await Promise.all([
    getBlogBySlugApi(slug).catch(() => null),
    getPublishedBlogsApi({ page: 1, limit: 20 }).catch(() => ({ blogs: [] })),
    getBlogTagsApi().catch(() => []),
  ]);

  if (!blog) notFound();

  const recentPosts = (recentData?.blogs || [])
    .filter((item) => item?._id !== blog?._id)
    .sort((a, b) => {
      const aDate = new Date(a?.publishedAt || a?.createdAt || 0).getTime();
      const bDate = new Date(b?.publishedAt || b?.createdAt || 0).getTime();
      return bDate - aDate;
    })
    .slice(0, 3);

  const title = blog.metaTitle || blog.title || 'Blog Post';
  const description =
    blog.metaDescription ||
    blog.excerpt ||
    'Read the latest post from Travl.';
  const canonical = `${SITE_URL}/blog/${blog.slug || slug}`;
  const image = blog.coverImageUrl || `${SITE_URL}/og-image.png`;
  const faqs = blog.faqs || [];

  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical,
      title,
      description,
    }),
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
      ? [
          buildFAQPage({
            canonical,
            title: `${blog.title} FAQs`,
            description,
            faqs,
          }),
        ]
      : []),
  ]);

  const breadcrumbPaths = [
    { label: 'Home', path: '/' },
    { label: 'Blog', path: '/blog' },
    { label: blog.title, path: `/blog/${blog.slug || slug}` },
  ];
  const breadcrumbJsonLd = buildBreadcrumbList({ paths: breadcrumbPaths });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <PrimarySection className="pb-20 pt-20 lg:pb-12 lg:pt-30">
        <Container className="grid grid-cols-1 gap-15 lg:grid-cols-[7fr_3fr]">
          <div>
            <div className="mb-10 aspect-16/8 overflow-hidden rounded-3xl bg-gray-100">
              <BlogImage
                src={image}
                alt={blog.title}
                className="h-full w-full object-cover object-center"
              />
            </div>

            <div className="mb-10">
              <Breadcrumb paths={breadcrumbPaths} />
              <h1 className="mb-4 text-2xl font-medium leading-9 lg:text-4xl lg:leading-12">
                {blog.title}
              </h1>
              <div className="mb-4 flex items-center text-sm font-light text-gray-900/50">
                {blog.updatedAt ? (
                  <span>Updated {formatDate(blog.updatedAt)}</span>
                ) : (
                  <span>Published {formatDate(blog.publishedAt)}</span>
                )}
                <span className="mx-2">•</span>
                <span>{blog.author?.name}</span>
                <span className="mx-2">•</span>
                {Array.isArray(blog.tags) && blog.tags.length > 0 ? (
                  <span className="flex flex-wrap items-center gap-1">
                    {blog.tags.map((tagName, index) => {
                      const tagObj = allBlogTags.find(
                        (tag) =>
                          String(tag.name).toLowerCase() ===
                          String(tagName).toLowerCase(),
                      );

                      return (
                        <span
                          key={`${tagName}-${index}`}
                          className="inline-flex items-center gap-1"
                        >
                          {index > 0 && <span>,</span>}
                          {tagObj ? (
                            <Link
                              href={`/blog/tag/${tagObj.slug || tagObj._id}`}
                              className="text-primary-700 hover:underline"
                            >
                              {tagName}
                            </Link>
                          ) : (
                            <span>{tagName}</span>
                          )}
                        </span>
                      );
                    })}
                  </span>
                ) : (
                  <span>General</span>
                )}
              </div>
            </div>

            {blog.quickAnswer && (
              <div className="mb-8 rounded-2xl border border-primary-100 bg-primary-50/60 p-5">
                <p className="mb-2 text-sm font-medium uppercase tracking-[0.16em] text-primary-700">
                  Quick Answer
                </p>
                <p className="text-[15px] leading-7 text-gray-700">
                  {blog.quickAnswer}
                </p>
              </div>
            )}

            <div
              dangerouslySetInnerHTML={{ __html: blog.content }}
              className="blog_post font-outfit"
            />

            {faqs.length > 0 && (
              <section className="mt-14">
                <h2 className="mb-6 text-2xl font-medium text-gray-900">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <FAQAccordion
                      key={`${faq.question}-${index}`}
                      question={faq.question}
                    >
                      <p>{faq.answer}</p>
                    </FAQAccordion>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="sticky top-24 h-fit self-start">
            <h2 className="mb-5 font-normal">Recently Published Posts:</h2>
            <div className="flex flex-col gap-6">
              {recentPosts.map((post) => (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug}`}
                  className="grid grid-cols-[2fr_8fr] items-center gap-3 overflow-hidden"
                >
                  <BlogImage
                    src={post.coverImageUrl}
                    alt={post.title}
                    className="aspect-square w-full rounded-md border-0 bg-gray-100 object-cover object-center"
                  />
                  <div>
                    <h3 className="text-sm leading-5 font-light">
                      {post.title}
                    </h3>
                    <p className="mt-1 text-[12px] font-extralight text-gray-600">
                      {formatDate(post.publishedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10 rounded-xl border border-gray-200 bg-white p-4">
              <p className="mb-3 text-sm font-medium text-gray-900">
                Share this post
              </p>
              <ShareButtons title={blog.title} url={canonical} />
            </div>
          </div>
        </Container>
      </PrimarySection>
    </>
  );
}

function Breadcrumb({ paths = [] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="text-[14px] text-gray-500 lg:text-sm"
    >
      <ol className="flex flex-wrap items-center gap-y-1">
        {paths.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex items-center font-light"
          >
            {index > 0 && <span className="mx-2 lg:mx-3">/</span>}
            {index === paths.length - 1 ? (
              <span aria-current="page" className="text-gray-900">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.path}
                className="transition-colors hover:text-primary-600"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function BlogImage({ src, alt, className }) {
  // dynamic content — src is an external API URL; next/image requires remotePatterns config
  return <img src={src} alt={alt} className={className} />;
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
