import { getBlogTagsApi } from '@travel-suite/frontend-shared/services/apiBlogTags';
import {
  SITE_URL,
  buildBreadcrumbList,
  buildGraph,
  buildMetadata,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import BlogTagsPage from '@travel-suite/frontend-shared/pages/client/BlogTagsPage';

const meta = {
  title: 'Blog Tags | Emirates Limo',
  description: 'Browse blog topics to find published posts about Dubai travel, airport transfers, chauffeur services, and more.',
  canonical: `${SITE_URL}/blog/tags`,
};

const hero = {
  title: 'Blog Tags',
  subtitle: 'Explore topics and read the latest published posts under each tag.',
};

const breadcrumbPaths = [
  { label: 'Home', path: '/' },
  { label: 'Blog', path: '/blog' },
  { label: 'Tags', path: '/blog/tags' },
];

export const metadata = buildMetadata(meta);

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
