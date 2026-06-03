import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import BlogPaginationBar from '@travel-suite/frontend-shared/components/ui/v1/BlogPaginationBar';
import { getPublishedBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import PageHero from '@/sections/PageHero';
import { SITE_URL } from '@/config';

export const metadata = {
  title: 'Airport Transfer Tips & Travel Guides – AirportRides Blog',
  description:
    'Expert airport transfer advice, city arrival guides, and travel tips to help you arrive relaxed — wherever in the world you land.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    url: `${SITE_URL}/blog`,
    title: 'Airport Transfer Tips & Travel Guides – AirportRides Blog',
    description:
      'Expert airport transfer advice, city arrival guides, and travel tips to help you arrive relaxed — wherever in the world you land.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

export const revalidate = 3600;

const paths = [
  { label: 'Home', path: '/' },
  { label: 'Blog', path: '/blog' },
];

function BlogCard({ slug, title, excerpt, date, readTime, coverImageUrl }) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex flex-col rounded-card bg-sand-50 border border-sand-200 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-warm-sm"
    >
      <div className="relative aspect-video bg-sand-200 overflow-hidden">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover object-center duration-500 group-hover:scale-105"
            alt={title ?? 'Blog post'}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-sand-200 via-clay-100 to-honey-300/30" />
        )}
      </div>

      <div className="flex flex-col flex-1 p-6">
        <div className="flex items-center gap-2 text-xs text-ink-mute mb-3">
          {date && <span>{format(new Date(date), 'dd MMM yyyy')}</span>}
          {readTime && (
            <>
              <span aria-hidden="true">·</span>
              <span>{readTime} min read</span>
            </>
          )}
        </div>
        <h3 className="font-display text-lg font-semibold text-ink leading-snug mb-2 line-clamp-2 group-hover:text-clay-600 transition-colors">
          {title}
        </h3>
        {excerpt && (
          <p className="text-sm text-ink-soft leading-relaxed line-clamp-3 flex-1">{excerpt}</p>
        )}
        <span className="mt-4 text-xs font-semibold text-clay-600 group-hover:text-clay-700 transition-colors">
          Read article →
        </span>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full py-20 text-center">
      <p className="font-display text-2xl font-semibold text-ink mb-3">Articles coming soon</p>
      <p className="text-ink-soft max-w-sm mx-auto">
        We&apos;re working on airport guides and transfer tips for destinations worldwide. Check back
        soon.
      </p>
    </div>
  );
}

export default async function BlogPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, Number(resolvedSearchParams?.page || 1) || 1);

  let blogs = [];
  let pagination = null;
  try {
    const data = await getPublishedBlogsApi({ page: currentPage, limit: 9 });
    blogs = data?.blogs ?? [];
    pagination = data?.pagination ?? null;
  } catch {
  }

  return (
    <>
      <PageHero
        title="Blog"
        subtitle="Airport transfer tips, city arrival guides, and travel advice to help you arrive relaxed — wherever in the world you land."
        paths={paths}
      />

      <section className="py-16 md:py-20">
        <Container>
          {blogs.length === 0 ? (
            <div className="grid">
              <EmptyState />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {blogs.map((post) => (
                <BlogCard
                  key={post._id}
                  slug={post.slug}
                  title={post.title}
                  excerpt={post.excerpt}
                  date={post.publishedAt || post.createdAt}
                  readTime={post.readingTime}
                  coverImageUrl={post.coverImageUrl}
                />
              ))}
            </div>
          )}

          {pagination && (
            <div className="mt-12">
              <BlogPaginationBar
                pagination={pagination}
                currentPage={currentPage}
                basePath="/blog"
              />
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
