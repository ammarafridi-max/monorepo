import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import { getBlogTagBySlugApi, getBlogTagsApi } from '@travel-suite/frontend-shared/services/apiBlogTags';
import {
  SITE_URL,
  buildBlog,
  buildBreadcrumbList,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import PrimarySection from '@travel-suite/frontend-shared/components/v1/PrimarySection';
import Container from '@travel-suite/frontend-shared/components/v1/layout/Container';

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const tags = await getBlogTagsApi();

    return (tags || [])
      .map((tag) => tag?.slug)
      .filter(Boolean)
      .map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tag = await getBlogTagBySlugApi(slug).catch(() => null);

  if (!tag) {
    return {
      title: 'Blog Tag Not Found',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = tag.metaTitle || `${tag.name} | Blog Tag | Travl`;
  const description =
    tag.metaDescription ||
    tag.description ||
    `Explore published blog posts under the ${tag.name} tag.`;
  const canonical = `${SITE_URL}/blog/tag/${tag.slug || slug}`;

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
      url: canonical,
      title,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
  };
}

export default async function BlogTagPage({ params, searchParams }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, Number(resolvedSearchParams?.page || 1) || 1);

  const tag = await getBlogTagBySlugApi(slug).catch(() => null);
  if (!tag) notFound();

  const data = await getPublishedBlogsApi({
    page: currentPage,
    limit: 9,
    tag: tag.name,
  }).catch(() => ({ blogs: [], pagination: null }));

  const blogs = data?.blogs || [];
  const pagination = data?.pagination || null;

  const title = tag.metaTitle || `${tag.name} | Blog Tag | Travl`;
  const description =
    tag.metaDescription ||
    tag.description ||
    `Explore published blog posts under the ${tag.name} tag.`;
  const canonical = `${SITE_URL}/blog/tag/${tag.slug || slug}`;
  const breadcrumb = [
    { label: 'Home', path: '/' },
    { label: 'Blog', path: '/blog' },
    { label: 'Tags', path: '/blog/tags' },
    { label: tag.name, path: `/blog/tag/${tag.slug || slug}` },
  ];

  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical,
      title,
      description,
    }),
    buildBlog({
      canonical,
      title,
      description,
    }),
  ]);
  const breadcrumbJsonLd = buildBreadcrumbList({ paths: breadcrumb });

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

      <BlogHero
        title={tag.name}
        subtitle={tag.description || 'Published posts under this tag.'}
        paths={breadcrumb}
      />

      <PrimarySection className="py-10 lg:py-14">
        <Container>
          {blogs.length === 0 ? (
            <p className="text-gray-600">No published posts found for this tag yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
                {blogs.map((post) => (
                  <BlogCard key={post._id} blog={post} />
                ))}
              </div>
              <PaginationBar
                currentPage={pagination?.page || currentPage}
                pagination={pagination}
                slug={tag.slug || slug}
              />
            </>
          )}
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
    <nav aria-label="Breadcrumb" className="text-[14px] text-gray-500 lg:text-sm">
      <ol className="flex flex-wrap items-center gap-y-1">
        {paths.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center font-light">
            {index > 0 && <span className="mx-2 lg:mx-3">/</span>}
            {index === paths.length - 1 ? (
              <span aria-current="page" className="text-gray-900">
                {item.label}
              </span>
            ) : (
              <Link href={item.path} className="transition-colors hover:text-primary-600">
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
      <div className="aspect-video overflow-hidden bg-gray-100">
        <BlogImage
          src={coverImageUrl}
          alt={title || 'Blog post'}
          className="h-full w-full object-cover object-center duration-500 group-hover:scale-105"
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
        <p className="line-clamp-2 font-outfit text-sm font-light text-gray-600">{excerpt}</p>
      </div>
    </Link>
  );
}

function PaginationBar({ pagination, currentPage, slug }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const basePath = `/blog/tag/${slug}`;
  const prevHref =
    currentPage - 1 <= 1 ? basePath : `${basePath}?page=${currentPage - 1}`;
  const nextHref = `${basePath}?page=${currentPage + 1}`;

  return (
    <div className="mt-8 flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
      <p className="text-sm text-gray-600">
        Showing {pagination.total > 0 ? (currentPage - 1) * pagination.limit + 1 : 0} -{' '}
        {pagination.total > 0 ? Math.min(currentPage * pagination.limit, pagination.total) : 0} of {pagination.total}
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
    return <span className={`${className} cursor-not-allowed opacity-50`}>{children}</span>;
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function BlogImage({ src, alt, className }) {
  // dynamic content — src is an external API URL; next/image requires remotePatterns config
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
