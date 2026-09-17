import { getBlogTagsApi } from '@travel-suite/frontend-shared/services/apiBlogTags';
import {
  SITE_URL,
  buildBreadcrumbList,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import BlogTagsPage from '@travel-suite/frontend-shared/pages/client/BlogTagsPage';

const meta = {
  title: 'Blog Tags | Travl',
  description:
    'Browse Travl blog topics: travel insurance cover, costs, claims, visa insurance requirements and destination guides for UAE residents.',
  canonical: `${SITE_URL}/blog/tags`,
};

const hero = {
  title: 'Blog Tags',
  subtitle: 'Explore topics and read the latest published posts under each tag.',
  points: ['Filter by Topic', 'Visa, Insurance & More', 'Updated Regularly', 'Written by Specialists'],
};

const breadcrumbPaths = [
  { label: 'Home', path: '/' },
  { label: 'Blog', path: '/blog' },
  { label: 'Tags', path: '/blog/tags' },
];

export const metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: meta.canonical },
  robots: { index: true, follow: true },
  openGraph: {
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

export const revalidate = 300;

export default async function Page() {
  const tags = await getBlogTagsApi().catch(() => []);

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical: meta.canonical, title: meta.title, description: meta.description }),
  ]);
  const breadcrumbJsonLd = buildBreadcrumbList({ paths: breadcrumbPaths });

  return (
    <BlogTagsPage
      tags={tags || []}
      hero={hero}
      breadcrumbPaths={breadcrumbPaths}
      schema={schema}
      breadcrumbJsonLd={breadcrumbJsonLd}
    />
  );
}
