import Link from 'next/link';
import { getBlogTagsApi } from '@travel-suite/frontend-shared/services/apiBlogTags';
import {
  SITE_URL,
  buildBreadcrumbList,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import PrimarySection from '@travel-suite/frontend-shared/components/v1/PrimarySection';
import Container from '@travel-suite/frontend-shared/components/v1/layout/Container';

const pageData = {
  meta: {
    title: 'Blog Tags | Travl',
    description:
      'Browse blog categories to find published posts about visas, travel insurance, flight reservations, and related topics.',
    canonical: `${SITE_URL}/blog/tags`,
  },
  breadcrumb: [
    { label: 'Home', path: '/' },
    { label: 'Blog', path: '/blog' },
    { label: 'Tags', path: '/blog/tags' },
  ],
  hero: {
    title: 'Blog Tags',
    subtitle: 'Explore topics and read the latest published posts under each tag.',
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

export const revalidate = 300;

export default async function BlogTagsPage() {
  const tags = await getBlogTagsApi().catch(() => []);

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
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

      <PrimarySection className="py-10 lg:py-14">
        <Container>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {(tags || []).map((tag) => (
              <Link
                key={tag._id}
                href={`/blog/tag/${tag.slug || tag._id}`}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <h2 className="text-xl font-medium text-gray-900">{tag.name}</h2>
                <p className="mt-2 line-clamp-3 text-sm font-light text-gray-600">
                  {tag.description || 'Read all posts under this tag.'}
                </p>
              </Link>
            ))}
          </div>
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
