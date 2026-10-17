import { getPublishedBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import BlogPage from '@travel-suite/frontend-shared/pages/client/BlogPage';
import {
  SITE_URL,
  buildBlog,
  buildBreadcrumbList,
  buildGraph,
  buildMetadata,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '../../../lib/schema';


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

const pageNumberFrom = (searchParams) => Math.max(1, Number(searchParams?.page || 1) || 1);

const canonicalForPage = (page) => (page > 1 ? `${meta.canonical}?page=${page}` : meta.canonical);

export async function generateMetadata({ searchParams }) {
  const page = pageNumberFrom(await searchParams);
  return buildMetadata({
    title: page > 1 ? `${meta.title} | Page ${page}` : meta.title,
    description: meta.description,
    canonical: canonicalForPage(page),
  });
}

export const revalidate = 3600;

export default async function Page({ searchParams }) {
  const currentPage = pageNumberFrom(await searchParams);
  const canonical = canonicalForPage(currentPage);

  let blogs = [];
  let pagination = null;
  try {
    const data = await getPublishedBlogsApi({ page: currentPage, limit: 15 });
    blogs = data?.blogs || [];
    pagination = data?.pagination || null;
  } catch {
  }

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical, title: meta.title, description: meta.description }),
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
