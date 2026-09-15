import { getBlogTagsApi } from '@travel-suite/frontend-shared/services/apiBlogTags';
import BlogTagsPage from '@travel-suite/frontend-shared/pages/client/BlogTagsPage';
import {
  SITE_URL,
  buildBreadcrumbList,
  buildGraph,
  buildMetadata,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '../../../../lib/schema';

// The tag index, rendered by the shared BlogTagsPage the travel brands use.

const meta = {
  title: 'Blog Topics | Picturesk',
  description: 'Browse Picturesk blog topics: selfie tips, LinkedIn photos, headshot styles and what makes an AI headshot look professional.',
  canonical: `${SITE_URL}/blog/tags`,
};

const hero = {
  title: 'Blog topics',
  subtitle: 'Pick a topic and read the latest guides under it.',
};

const breadcrumbPaths = [
  { label: 'Home', path: '/' },
  { label: 'Blog', path: '/blog' },
  { label: 'Topics', path: '/blog/tags' },
];

export const metadata = buildMetadata(meta);

// Same rule as the other blog routes under (site): the layout reads the session cookie, so this cannot be static.
export const dynamic = 'force-dynamic';

export default async function Page() {
  const tags = await getBlogTagsApi().catch(() => []);

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical: meta.canonical, title: meta.title, description: meta.description }),
  ]);
  const breadcrumbJsonLd = buildBreadcrumbList({ paths: breadcrumbPaths });

  return (
    <main className="shared-ui blogpage">
      <BlogTagsPage
        tags={tags || []}
        hero={hero}
        breadcrumbPaths={breadcrumbPaths}
        schema={schema}
        breadcrumbJsonLd={breadcrumbJsonLd}
      />
    </main>
  );
}
