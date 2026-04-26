import Link from "next/link";
import Image from "next/image";
import Container from "../../components/v1/layout/Container";
import PrimarySection from "../../components/v1/PrimarySection";
import FAQAccordion from "../../components/v1/FAQAccordion";
import ShareButtons from "../../components/v1/blog/ShareButtons";

/**
 * BlogPostPage — shared UI component for the blog post detail page.
 *
 * Data fetching, schema building, and metadata generation all live in the
 * individual frontend's page.js (they reference brand-specific SITE_URL,
 * buildOrganization, etc.). This component is a pure render layer.
 *
 * Props:
 *   blog             — full blog document from the API
 *   recentPosts      — array of recent posts (already filtered + sliced to 3)
 *   allBlogTags      — array of all tag objects (used to resolve tag slugs)
 *   canonical        — canonical URL for this post  e.g. https://travl.ae/blog/my-post
 *   siteUrl          — brand site URL, used for the og-image fallback
 *   graph            — pre-built JSON-LD graph object (brand-specific)
 *   breadcrumbJsonLd — pre-built breadcrumb JSON-LD object (brand-specific)
 *   breadcrumbPaths  — array of { label, path } for the breadcrumb nav
 */
export default function BlogPostPage({
  blog,
  recentPosts = [],
  allBlogTags = [],
  canonical,
  siteUrl,
  graph,
  breadcrumbJsonLd,
  breadcrumbPaths = [],
}) {
  const image = blog.coverImageUrl || `${siteUrl}/og-image.png`;
  const faqs = blog.faqs || [];

  return (
    <>
      {graph && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}

      <PrimarySection className="pb-20 pt-20 lg:pb-12 lg:pt-30">
        <Container className="grid grid-cols-1 gap-15 lg:grid-cols-[7fr_3fr]">
          {/* ── Main column ── */}
          <div>
            {/* Cover image */}
            <div className="relative mb-10 aspect-16/8 overflow-hidden rounded-3xl bg-gray-100">
              <CoverImage src={image} alt={blog.title} />
            </div>

            {/* Breadcrumb + title + meta */}
            <div className="mb-10">
              <Breadcrumb paths={breadcrumbPaths} />
              <h1 className="mb-4 text-2xl font-medium leading-9 lg:text-4xl lg:leading-12">
                {blog.title}
              </h1>
              <div className="mb-4 flex flex-wrap items-center gap-x-0 text-sm font-light text-gray-900/50">
                {blog.updatedAt ? (
                  <span>Updated {formatDate(blog.updatedAt)}</span>
                ) : (
                  <span>Published {formatDate(blog.publishedAt)}</span>
                )}
                <span className="mx-2">•</span>
                <span>{blog.author?.name}</span>
                <span className="mx-2">•</span>
                <TagList tags={blog.tags} allBlogTags={allBlogTags} />
              </div>
            </div>

            {/* Quick answer */}
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

            {/* Body content */}
            <div
              dangerouslySetInnerHTML={{ __html: blog.content }}
              className="blog_post font-outfit"
            />

            {/* FAQs */}
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

          {/* ── Sidebar ── */}
          <Sidebar
            recentPosts={recentPosts}
            blog={blog}
            canonical={canonical}
          />
        </Container>
      </PrimarySection>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Sidebar({ recentPosts, blog, canonical }) {
  return (
    <div className="sticky top-15 h-fit self-start">
      <h2 className="mb-5 font-bold">Recently Published Posts:</h2>
      <div className="flex flex-col gap-6">
        {recentPosts.map((post) => (
          <Link
            key={post._id}
            href={`/blog/${post.slug}`}
            className="flex items-start gap-3 overflow-hidden"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-200">
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="h-full w-full object-cover object-center"
              />
            </div>
            <div className="min-w-0">
              <h3 className="mb-1 text-sm font-normal leading-[1.4] line-clamp-3">
                {post.title}
              </h3>
              <p className="text-[12px] font-light text-gray-500">
                {formatDate(post.publishedAt)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-xl bg-white">
        <ShareButtons title={blog.title} url={canonical} />
      </div>
    </div>
  );
}

function Breadcrumb({ paths = [] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 text-[14px] text-gray-500 lg:text-sm"
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

function TagList({ tags, allBlogTags }) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return <span>General</span>;
  }

  return (
    <span className="flex flex-wrap items-center gap-1">
      {tags.map((tagName, index) => {
        const tagObj = allBlogTags.find(
          (tag) =>
            String(tag.name).toLowerCase() === String(tagName).toLowerCase(),
        );

        return (
          <span
            key={`${tagName}-${index}`}
            className="inline-flex items-center gap-1"
          >
            {index > 0 && <span>,</span>}
            {tagObj ? (
              <Link
                href={`/blog/tags/${tagObj.slug || tagObj._id}`}
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
  );
}

function CoverImage({ src, alt }) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover object-center"
      sizes="(max-width: 1024px) 100vw, 70vw"
      unoptimized
    />
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
