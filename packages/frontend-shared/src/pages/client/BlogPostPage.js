import Image from "next/image";
import { HiBolt, HiOutlineCalendar, HiOutlineClock, HiOutlineUser } from "react-icons/hi2";
import Link from "next/link";
import Breadcrumb from "../../components/shared/layout/Breadcrumb";
import Container from "../../components/shared/layout/Container";
import PrimarySection from "../../components/shared/layout/PrimarySection";
import FaqAccordion from "../../components/ui/v2/FaqAccordion";
import ShareButtons from "../../components/ui/v2/ShareButtons";
import BlogChipNav from "../../components/sections/v2/BlogChipNav";
import BlogOfferRail from "../../components/sections/v2/BlogOfferRail";
import BlogRelatedPosts from "../../components/sections/v2/BlogRelatedPosts";
import BlogOfferCard from "../../components/ui/v2/BlogOfferCard";
import BlogInlineOffer from "../../components/ui/v2/BlogInlineOffer";
import { prepareArticleHtml } from "../../utils/articleHtml.js";

const INLINE_OFFER_AFTER_HEADING = 2;

export default function BlogPostPage({
  blog,
  recentPosts = [],
  relatedPosts = [],
  allBlogTags = [],
  offers = [],
  inlineOffer = null,
  canonical,
  siteUrl,
  graph,
  breadcrumbJsonLd,
  breadcrumbPaths = [],
}) {
  const image = blog.coverImageUrl || `${siteUrl}/og-image.png`;
  const faqs = blog.faqs || [];

  const { headings, htmlBefore, htmlAfter, didSplit } = prepareArticleHtml(
    blog.content,
    { splitAfterHeading: inlineOffer ? INLINE_OFFER_AFTER_HEADING : 0 },
  );

  const primaryOffer = offers[0] ?? null;

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

      <PrimarySection className="pb-20 pt-12 lg:pb-12 lg:pt-20">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-14">
          <article>
            <div className="mb-4">
              <Breadcrumb paths={breadcrumbPaths} includeSchema={false} />
            </div>

            <h1 className="mb-4 text-2xl font-medium leading-9 lg:text-4xl lg:leading-12">
              {blog.title}
            </h1>

            <ArticleMeta blog={blog} sectionCount={headings.length} />

            {blog.quickAnswer && (
              <QuickAnswer answer={blog.quickAnswer} offer={primaryOffer} />
            )}

            <BlogChipNav headings={headings} className="mb-8" />

            {blog.coverImageUrl && (
              <div className="relative mb-10 aspect-21/9 overflow-hidden rounded-2xl bg-gray-100 sm:aspect-21/7">
                <Image
                  src={image}
                  alt={blog.title}
                  fill
                  priority
                  fetchPriority="high"
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 760px"
                />
              </div>
            )}

            <div
              dangerouslySetInnerHTML={{ __html: htmlBefore }}
              className="blog_post font-outfit"
            />

            {didSplit && (
              <>
                <BlogInlineOffer offer={inlineOffer} />
                <div
                  dangerouslySetInnerHTML={{ __html: htmlAfter }}
                  className="blog_post font-outfit"
                />
              </>
            )}

            {faqs.length > 0 && (
              <section className="mt-14 border-t border-gray-100 pt-10">
                <h2 className="mb-6 text-2xl font-medium text-gray-900">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <FaqAccordion
                      key={`${faq.question}-${index}`}
                      question={faq.question}
                      defaultOpen={index === 0}
                    >
                      {faq.answer}
                    </FaqAccordion>
                  ))}
                </div>
              </section>
            )}

            <TagPills tags={blog.tags} allBlogTags={allBlogTags} />

            {/* Desktop rail carries the contents, so offers live here on mobile only. */}
            {offers.length > 0 && (
              <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
                {offers.map((offer) => (
                  <BlogOfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            )}

            <div className="mt-10 lg:hidden">
              <ShareButtons title={blog.title} slug={blog.slug} />
            </div>

            <BlogRelatedPosts posts={relatedPosts} />
          </article>

          <BlogOfferRail
            headings={headings}
            recentPosts={recentPosts}
            title={blog.title}
            slug={blog.slug}
          />
        </Container>
      </PrimarySection>
    </>
  );
}

function ArticleMeta({ blog, sectionCount }) {
  const dot = (
    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-gray-300" />
  );

  return (
    <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-gray-500 md:text-sm">
      <span className="inline-flex items-center gap-1.5">
        <HiOutlineCalendar aria-hidden="true" className="text-[15px] text-gray-400" />
        {blog.updatedAt
          ? `Updated ${formatDate(blog.updatedAt)}`
          : `Published ${formatDate(blog.publishedAt)}`}
      </span>

      {blog.readingTime > 0 && (
        <>
          {dot}
          <span className="inline-flex items-center gap-1.5">
            <HiOutlineClock aria-hidden="true" className="text-[15px] text-gray-400" />
            {blog.readingTime} min read
          </span>
        </>
      )}

      {sectionCount > 1 && (
        <>
          {dot}
          <span>{sectionCount} sections</span>
        </>
      )}

      {blog.author?.name && (
        <>
          {dot}
          <span className="inline-flex items-center gap-1.5">
            <HiOutlineUser aria-hidden="true" className="text-[15px] text-gray-400" />
            {blog.author.name}
          </span>
        </>
      )}
    </div>
  );
}

function QuickAnswer({ answer, offer }) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl border border-primary-100 bg-[linear-gradient(135deg,#f5fbfb_0%,#eef6ff_55%,#fff8f1_100%)] p-5 md:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary-200/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-12 -left-8 h-24 w-24 rounded-full bg-accent-100/40 blur-3xl"
      />

      <div className="relative flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 shadow-[0_6px_16px_rgba(16,24,40,0.15)]">
          <HiBolt aria-hidden="true" className="text-[16px] text-white" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-700">
          The Short Answer
        </span>
        <span
          aria-hidden="true"
          className="h-px flex-1 bg-linear-to-r from-primary-200/70 to-transparent"
        />
      </div>

      <p className="relative mt-4 text-[15px] leading-7 text-gray-800 md:text-[16px]">
        {answer}
      </p>

      {/* Desktop keeps this text-only — the sticky rail is already asking. */}
      {offer?.href && offer?.cta && (
        <div className="relative mt-5 lg:hidden">
          {offer.external ? (
            <a
              href={offer.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-primary-700 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-primary-800"
            >
              {offer.cta}
            </a>
          ) : (
            <Link
              href={offer.href}
              className="inline-flex items-center justify-center rounded-full bg-primary-700 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-primary-800"
            >
              {offer.cta}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function TagPills({ tags, allBlogTags }) {
  if (!Array.isArray(tags) || tags.length === 0) return null;

  const baseClass =
    "inline-flex items-center rounded-full border border-gray-200 bg-gray-50/60 px-3 py-1 text-[12px] font-medium text-gray-700";

  return (
    <div className="mt-10 flex flex-wrap items-center gap-1.5">
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

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
