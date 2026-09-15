import { notFound } from 'next/navigation';
import { nullOn404 } from '@travel-suite/frontend-shared/services/apiClient';
import { getAuthorBySlugApi } from '@travel-suite/frontend-shared/services/apiAuthors';
import { getPublishedBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import AuthorPage from '@travel-suite/frontend-shared/pages/client/AuthorPage';
import {
  SITE_URL,
  buildBreadcrumbList,
  buildGraph,
  buildOrganization,
  buildPerson,
  buildProfilePage,
  buildWebsite,
} from '../../../../lib/schema';

// The author profile page, rendered by the shared AuthorPage. Every blog post's
// byline links here, so the route has to exist or each post carries a 404. Same
// rule as the post and tag routes: no loading.js above this, so an unknown slug
// is a real 404.

const FALLBACK = (name) => `AI headshot guides written by ${name} for Picturesk.`;

function metaDescriptionFrom(bio, fallback) {
  const first = (bio || '').split(/\n{2,}/)[0].trim();
  if (!first) return fallback;
  if (first.length <= 160) return first;
  return `${first.slice(0, 157).replace(/\s+\S*$/, '')}...`;
}

// Rendered per request, never prerendered. The (site) layout reads the session
// cookie, so nothing under it can be static; a route that also exported
// generateStaticParams + revalidate promised a static page and then hit that
// cookie on its first on-demand render, which is a DYNAMIC_SERVER_USAGE 500 in
// production. The api responses are still cached through each fetch's own
// `next.revalidate`, so the cost is the render, not the network.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const author = await getAuthorBySlugApi(slug).catch(nullOn404);
  if (!author) return { title: 'Author not found. Picturesk.ai', robots: { index: false, follow: false } };

  const profile = author.authorProfile || {};
  const title = `${author.name} | Picturesk`;
  const description = metaDescriptionFrom(profile.bio, FALLBACK(author.name));
  const canonical = `${SITE_URL}/authors/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'profile',
      url: canonical,
      title,
      description,
      images: [profile.avatarUrl || `${SITE_URL}/og-image.png`],
    },
    twitter: { card: 'summary', title, description },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const author = await getAuthorBySlugApi(slug).catch(nullOn404);
  if (!author) notFound();

  const profile = author.authorProfile || {};
  const canonical = `${SITE_URL}/authors/${slug}`;
  const description = profile.bio || FALLBACK(author.name);

  const data = await getPublishedBlogsApi({ page: 1, limit: 50, author: author._id }).catch(
    () => ({ blogs: [] })
  );

  const breadcrumbPaths = [
    { label: 'AI Headshot Generator', path: '/ai-headshot-generator' },
    { label: 'Blog', path: '/blog' },
    { label: author.name, path: `/authors/${slug}` },
  ];

  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildProfilePage({ canonical, title: author.name, description, slug }),
    buildPerson({
      name: author.name,
      slug,
      jobTitle: profile.jobTitle,
      bio: profile.bio,
      image: profile.avatarUrl,
      sameAs: profile.sameAs,
      expertise: profile.expertise,
    }),
  ]);

  return (
    <main className="shared-ui blogpage">
      <AuthorPage
        author={author}
        posts={data?.blogs || []}
        breadcrumbPaths={breadcrumbPaths}
        graph={graph}
        breadcrumbJsonLd={buildBreadcrumbList({ paths: breadcrumbPaths })}
      />
    </main>
  );
}
