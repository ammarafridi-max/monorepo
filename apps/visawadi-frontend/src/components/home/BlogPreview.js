import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPublishedBlogsApi } from "@travel-suite/frontend-shared/services/apiBlog";
import { cloudinaryUrl } from "@travel-suite/frontend-shared/utils/cloudinary";
import { Section, SectionHeading } from "@/components/design-system/Shell";

function formatDate(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function BlogPreview({ heading, description }) {
  let posts = [];
  try {
    const data = await getPublishedBlogsApi({ limit: 3 });
    posts = data?.blogs || [];
  } catch {
    posts = [];
  }

  if (!posts.length) return null;

  return (
    <Section tone="surface">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading eyebrow="Guides" title={heading} description={description} />
        <Link
          href="/blog"
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line px-5 text-[0.9375rem] font-semibold text-ink transition-colors hover:border-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          Read the blog
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {posts.map((post) => {
          const date = formatDate(post.publishedAt || post.createdAt);
          return (
            <li key={post._id ?? post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-raised transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              >
                {post.coverImageUrl && (
                  <div className="relative m-2 aspect-[16/9] overflow-hidden rounded-[1rem] bg-canvas">
                    <Image
                      src={cloudinaryUrl(post.coverImageUrl, { width: 800 })}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col px-6 pb-6 pt-4">
                  <h3 className="text-[1.0625rem] font-semibold leading-snug text-ink">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2.5 line-clamp-2 text-meta leading-6 text-ink-body">
                      {post.excerpt}
                    </p>
                  )}
                  <p className="mt-auto pt-6 text-[0.8125rem] text-ink-soft">
                    {[date, post.readingTime ? `${post.readingTime} min read` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
