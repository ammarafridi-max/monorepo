import Link from 'next/link';
import Image from 'next/image';
import { getPublishedBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import {
  SITE_URL,
  buildBlog,
  buildBreadcrumbList,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import Container from '@travel-suite/frontend-shared/components/v1/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/v1/PrimarySection';

const pageData = {
  meta: {
    title: 'Travel Insurance & Visa Travel Blog | Tips, Guides & Updates',
    description:
      'Read practical visa travel guides, travel insurance tips, and updates to help you prepare stronger documentation for your next application.',
    canonical: `${SITE_URL}/blog`,
  },
  breadcrumb: [
    { label: 'Home', path: '/' },
    { label: 'Blog', path: '/blog' },
  ],
  hero: {
    title: 'Blog',
    subtitle:
      'Our blog covers travel insurance, visa requirements, flight reservations, and everything else you need to prepare a strong application. We share practical guides, tips, and updates to help you apply with confidence.',
  },
};

export const metadata = {
  title: pageData.meta.title,
  description: pageData.meta.description,
  alternates: {
    canonical: pageData.meta.canonical,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    url: pageData.meta.canonical,
    title: pageData.meta.title,
    description: pageData.meta.description,
    images: [`${SITE_URL}/og-image.png`],
  },
  twitter: {
    card: 'summary_large_image',
    title: pageData.meta.title,
    description: pageData.meta.description,
    images: [`${SITE_URL}/og-image.png`],
  },
};

export const revalidate = 3600;

export default async function BlogPage({ searchParams }) {
  const page = Math.max(1, Number(searchParams?.page || 1) || 1);
  let blogs = [];
  let pagination = null;
  try {
    const data = await getPublishedBlogsApi({ page, limit: 9 });
    blogs = data?.blogs || [];
    pagination = data?.pagination || null;
  } catch {
    // API unreachable at build time — ISR will populate on first request
  }

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical: pageData.meta.canonical,
      title: pageData.meta.title,
      description: pageData.meta.description,
    }),
    buildBlog({
      canonical: pageData.meta.canonical,
      title: pageData.meta.title,
      description: pageData.meta.description,
    }),
  ]);

  const breadcrumbJsonLd = buildBreadcrumbList({ paths: pageData.breadcrumb });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <BlogHero
        title={pageData.hero.title}
        subtitle={pageData.hero.subtitle}
        paths={pageData.breadcrumb}
      />

      <PrimarySection>
        <Container>
          <div className="block items-start gap-7 py-10 lg:grid lg:grid-cols-3 lg:gap-7 lg:py-15">
            {blogs.map((post) => (
              <BlogCard key={post._id} blog={post} />
            ))}
          </div>
          <PaginationBar
            pagination={pagination}
            currentPage={pagination?.page || page}
          />
        </Container>
      </PrimarySection>
    </>
  );
}

function BlogHero({ paths, title, subtitle }) {
  return (
    <PrimarySection className="relative overflow-hidden bg-[linear-gradient(160deg,#f5fbfb_0%,#eef4ff_52%,#fff9f4_100%)] pb-12 pt-24 md:pb-14 md:pt-28 lg:pb-16 lg:pt-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-accent-100/50 blur-3xl" />
      </div>
      <Container className="relative">
        <Breadcrumb paths={paths} />
        <h1 className="mb-5 mt-4 font-outfit text-3xl font-medium tracking-[-0.02em] text-gray-900 lg:text-5xl">
          {title}
        </h1>
        <p className="text-md leading-7 text-gray-600 lg:text-lg">{subtitle}</p>
      </Container>
    </PrimarySection>
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

function BlogCard({ blog }) {
  const { coverImageUrl, title, excerpt, createdAt, readingTime, slug } = blog;

  return (
    <Link
      href={`/blog/${slug}`}
      className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_14px_35px_rgba(16,24,40,0.08)] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(16,24,40,0.14)]"
    >
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        <BlogImage
          src={coverImageUrl}
          alt={title || 'Blog post'}
          className="object-cover object-center duration-500 group-hover:scale-105"
        />
      </div>
      <div className="px-5 py-6">
        <div className="flex items-center font-outfit text-[12px] font-light text-gray-500">
          <span>{formatDate(createdAt)}</span>
          <span className="mx-2">•</span>
          <span>{readingTime} mins</span>
        </div>
        <h2 className="mb-2 mt-1 line-clamp-2 font-outfit text-md font-medium leading-6 text-gray-900">
          {title}
        </h2>
        <p className="line-clamp-2 font-outfit text-sm font-light text-gray-600">
          {excerpt}
        </p>
      </div>
    </Link>
  );
}

function PaginationBar({ pagination, currentPage }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const prevHref =
    currentPage - 1 <= 1 ? '/blog' : `/blog?page=${currentPage - 1}`;
  const nextHref = `/blog?page=${currentPage + 1}`;

  return (
    <div className="mt-8 flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
      <p className="text-sm text-gray-600">
        Showing{' '}
        {pagination.total > 0 ? (currentPage - 1) * pagination.limit + 1 : 0} -{' '}
        {pagination.total > 0
          ? Math.min(currentPage * pagination.limit, pagination.total)
          : 0}{' '}
        of {pagination.total}
      </p>
      <div className="flex items-center gap-3">
        <PageLink href={prevHref} disabled={!pagination.hasPrevPage}>
          Previous
        </PageLink>
        <span className="text-sm text-gray-600">
          {currentPage} / {pagination.totalPages}
        </span>
        <PageLink href={nextHref} disabled={!pagination.hasNextPage}>
          Next
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({ href, disabled, children }) {
  const className =
    'rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100';

  if (disabled) {
    return (
      <span className={`${className} cursor-not-allowed opacity-50`}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function BlogImage({ src, alt, className }) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      unoptimized
    />
  );
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
