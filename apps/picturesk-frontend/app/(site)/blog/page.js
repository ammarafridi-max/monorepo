import { getPublishedBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import BlogPage from '@travel-suite/frontend-shared/pages/client/BlogPage';
import {
  SITE_URL,
  buildBlog,
  buildBreadcrumbList,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '../../../lib/schema';

// The blog index, rendered by the SHARED client BlogPage the travel brands use, so
// the layout, cards, pagination and breadcrumb stay identical across the monorepo.
// It is a Tailwind component tree and this site is plain CSS, so app/(site)/shared-ui.css
// compiles the utilities it needs and `.shared-ui` carries the resets it assumes.
//
// Posts come from the api's public blog routes (GET /api/blogs), which sit above
// the domain's auth guard, so no session is involved.

// Title 52 chars, description 141 chars, both carrying "AI headshot".
const meta = {
  title: 'AI Headshot Guides and Tips | Picturesk Blog',
  description:
    'Practical AI headshot guides: which selfies to upload, what makes a photo look professional, and how to get a LinkedIn photo you will actually use.',
  canonical: `${SITE_URL}/blog`,
};

const hero = {
  title: 'The Picturesk blog',
  subtitle: 'Guides and tips',
};

const breadcrumbPaths = [
  { label: 'Home', path: '/' },
  { label: 'Blog', path: '/blog' },
];

export const metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: meta.canonical },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: meta.canonical,
    title: meta.title,
    description: meta.description,
    images: [`${SITE_URL}/og-image.png`],
  },
  twitter: {
    card: 'summary_large_image',
    title: meta.title,
    description: meta.description,
    images: [`${SITE_URL}/og-image.png`],
  },
};

export const revalidate = 3600;

export default async function Page({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, Number(resolvedSearchParams?.page || 1) || 1);

  let blogs = [];
  let pagination = null;
  try {
    const data = await getPublishedBlogsApi({ page: currentPage, limit: 15 });
    blogs = data?.blogs || [];
    pagination = data?.pagination || null;
  } catch {
    // An api blip must not 500 the page; it renders empty and revalidates later.
  }

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical: meta.canonical, title: meta.title, description: meta.description }),
    buildBlog({ canonical: meta.canonical, title: meta.title, description: meta.description }),
  ]);
  const breadcrumbJsonLd = buildBreadcrumbList({ paths: breadcrumbPaths });

  return (
    <main className="shared-ui blogpage">
      <BlogPage
        blogs={blogs}
        pagination={pagination}
        currentPage={currentPage}
        hero={hero}
        breadcrumbPaths={breadcrumbPaths}
        schema={schema}
        breadcrumbJsonLd={breadcrumbJsonLd}
        listHeading="Latest guides"
      />
    </main>
  );
}
