import { notFound } from 'next/navigation';
import { nullOn404 } from '@travel-suite/frontend-shared/services/apiClient';
import { getAuthorBySlugApi, getAuthorsApi } from '@travel-suite/frontend-shared/services/apiAuthors';
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
} from '@/lib/schema';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const authors = await getAuthorsApi();
    return (authors || [])
      .map((a) => a?.authorProfile?.slug)
      .filter(Boolean)
      .map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const author = await getAuthorBySlugApi(slug).catch(nullOn404);

  if (!author) {
    return { title: 'Author Not Found', robots: { index: false, follow: false } };
  }

  const profile = author.authorProfile || {};
  // Name only: a multi-role job title pushes the tag past what a SERP shows.
  const title = author.name;
  const description =
    profile.bio || `Visa guides written by ${author.name} for VisaWadi.`;
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
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const author = await getAuthorBySlugApi(slug).catch(nullOn404);
  if (!author) notFound();

  const profile = author.authorProfile || {};
  const canonical = `${SITE_URL}/authors/${slug}`;
  const description = profile.bio || `Visa guides written by ${author.name} for VisaWadi.`;

  const data = await getPublishedBlogsApi({ page: 1, limit: 50, author: author._id }).catch(
    () => ({ blogs: [] }),
  );
  const posts = data?.blogs || [];

  const breadcrumbPaths = [
    { label: 'Home', path: '/' },
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
    <AuthorPage
      author={author}
      posts={posts}
      breadcrumbPaths={breadcrumbPaths}
      graph={graph}
      breadcrumbJsonLd={buildBreadcrumbList({ paths: breadcrumbPaths })}
    />
  );
}
