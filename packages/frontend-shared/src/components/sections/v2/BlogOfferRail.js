import Image from "next/image";
import Link from "next/link";
import BlogOfferCard from "../../ui/v2/BlogOfferCard";
import BlogTocRail from "./BlogTocRail";
import ShareButtons from "../../ui/v2/ShareButtons";

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/**
 * Sticky column beside an article.
 *
 * Renders whichever surfaces the app supplies, in priority order: contents,
 * then offers, then — for a brand that configured neither — the recent-posts
 * list, so nothing regresses. Share always sits at the bottom.
 */
export default function BlogOfferRail({
  headings = [],
  offers = [],
  recentPosts = [],
  title,
  slug,
}) {
  const hasToc = headings.length > 1;
  const hasOffers = offers.length > 0;
  const showRecent = !hasToc && !hasOffers && recentPosts.length > 0;

  return (
    <aside className="sticky top-24 hidden h-fit self-start lg:block">
      <div className="flex flex-col gap-4">
        {hasToc && <BlogTocRail headings={headings} />}

        {hasOffers &&
          offers.map((offer) => <BlogOfferCard key={offer.id} offer={offer} />)}

        {showRecent && (
              <div>
                <h2 className="mb-5 font-bold">Recently Published Posts:</h2>
                <div className="flex flex-col gap-6">
                  {recentPosts.map((post) => (
                    <Link
                      key={post._id}
                      href={`/blog/${post.slug}`}
                      className="flex items-start gap-3 overflow-hidden"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-200">
                        {post.coverImageUrl && (
                          <Image
                            src={post.coverImageUrl}
                            alt={post.title}
                            fill
                            sizes="64px"
                            loading="lazy"
                            className="object-cover object-center"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="mb-1 line-clamp-3 text-sm font-normal leading-[1.4]">
                          {post.title}
                        </h3>
                        <p className="text-[12px] font-light text-gray-500">
                          {formatDate(post.publishedAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <ShareButtons title={title} slug={slug} />
        </div>
      </div>
    </aside>
  );
}
