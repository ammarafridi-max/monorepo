import Link from "next/link";
import Image from "next/image";
import { HiBolt, HiOutlineCalendar, HiOutlineUser } from "react-icons/hi2";
import Breadcrumb from "../../components/v1/layout/Breadcrumb";
import Container from "../../components/v1/layout/Container";
import PrimarySection from "../../components/v1/layout/PrimarySection";
import FAQAccordion from "../../components/v1/ui/FAQAccordion";
import ShareButtons from "../../components/v1/ui/ShareButtons";

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
              <div className="mb-4">
                <Breadcrumb paths={breadcrumbPaths} includeSchema={false} />
              </div>
              <h1 className="mb-4 text-2xl font-medium leading-9 lg:text-4xl lg:leading-12">
                {blog.title}
              </h1>
              <div className="space-y-3">
                {/* Date + author */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-gray-500 md:text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <HiOutlineCalendar
                      aria-hidden="true"
                      className="text-[15px] text-gray-400"
                    />
                    {blog.updatedAt
                      ? `Updated ${formatDate(blog.updatedAt)}`
                      : `Published ${formatDate(blog.publishedAt)}`}
                  </span>
                  {blog.author?.name && (
                    <span className="inline-flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="h-1 w-1 rounded-full bg-gray-300"
                      />
                      <span className="inline-flex items-center gap-1.5">
                        <HiOutlineUser
                          aria-hidden="true"
                          className="text-[15px] text-gray-400"
                        />
                        {blog.author.name}
                      </span>
                    </span>
                  )}
                </div>

                {/* Tag pills */}
                <TagPills tags={blog.tags} allBlogTags={allBlogTags} />
              </div>
            </div>

            {/* Quick answer */}
            {blog.quickAnswer && (
              <div className="relative mb-10 overflow-hidden rounded-2xl border border-primary-100 bg-[linear-gradient(135deg,#f5fbfb_0%,#eef6ff_55%,#fff8f1_100%)] p-5 md:p-6">
                {/* Soft decorative blob */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary-200/30 blur-3xl"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-12 -left-8 h-24 w-24 rounded-full bg-accent-100/40 blur-3xl"
                />

                {/* Header: icon + label + hairline */}
                <div className="relative flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 shadow-[0_6px_16px_rgba(16,24,40,0.15)]">
                    <HiBolt
                      aria-hidden="true"
                      className="text-[16px] text-white"
                    />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-700">
                    Quick Answer
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-px flex-1 bg-linear-to-r from-primary-200/70 to-transparent"
                  />
                </div>

                {/* Answer: full-width paragraph */}
                <p className="relative mt-4 text-[15px] leading-7 text-gray-800 md:text-[16px]">
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

function TagPills({ tags, allBlogTags }) {
  if (!Array.isArray(tags) || tags.length === 0) return null;

  const baseClass =
    "inline-flex items-center rounded-full border border-gray-200 bg-gray-50/60 px-3 py-1 text-[12px] font-medium text-gray-700";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tagName, index) => {
        const tagObj = allBlogTags.find(
          (tag) =>
            String(tag.name).toLowerCase() === String(tagName).toLowerCase(),
        );
        const slug = tagObj?.slug || tagObj?._id;

        return slug ? (
          <Link
            key={`${tagName}-${index}`}
            href={`/blog/tags/${slug}`}
            className={`${baseClass} transition-colors hover:border-primary-200 hover:bg-primary-100`}
          >
            {tagName}
          </Link>
        ) : (
          <span key={`${tagName}-${index}`} className={baseClass}>
            {tagName}
          </span>
        );
      })}
    </div>
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
