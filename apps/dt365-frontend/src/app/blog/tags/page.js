import { getBlogTagsApi } from '@travel-suite/frontend-shared/services/apiBlogTags';
import {
  SITE_URL,
  buildBreadcrumbList,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import Link from 'next/link';
import BlogTagsPage from '@travel-suite/frontend-shared/pages/client/BlogTagsPage';

const LINK = 'font-semibold text-primary-700 underline hover:text-primary-800';

const intro = (
  <div className="flex flex-col gap-4 text-[15px] leading-7 text-gray-600">
    <p>
      These topics cover the questions people actually ask before they submit a visa file: what a
      PNR is and how a consulate checks one, whether a reservation is enough or a paid ticket is
      required, how long a booking needs to stay live, and what to do when a reservation expires
      before a decision arrives.
    </p>
    <p>
      If you already know what you need, go straight to the page for it. There are dummy tickets
      for a{' '}
      <Link href="/dummy-ticket-schengen-visa" className={LINK}>
        Schengen visa
      </Link>
      ,{' '}
      <Link href="/dummy-ticket-uk-visa" className={LINK}>
        a UK visa
      </Link>{' '}
      and{' '}
      <Link href="/dummy-ticket-canada-visa" className={LINK}>
        a Canada visa
      </Link>
      , an{' '}
      <Link href="/onward-ticket" className={LINK}>
        onward ticket for airline check-in
      </Link>
      , and local pricing for{' '}
      <Link href="/in" className={LINK}>
        India
      </Link>
      ,{' '}
      <Link href="/ae" className={LINK}>
        the UAE
      </Link>
      ,{' '}
      <Link href="/uk" className={LINK}>
        the UK
      </Link>
      ,{' '}
      <Link href="/ca" className={LINK}>
        Canada
      </Link>{' '}
      and{' '}
      <Link href="/sa" className={LINK}>
        Saudi Arabia
      </Link>
      .
    </p>
  </div>
);

const meta = {
  title: 'Dummy Ticket and Visa Blog Topics | Dummy Ticket 365',
  description:
    'Browse blog categories to find published posts about visas, dummy tickets, travel insurance, and related topics.',
  canonical: `${SITE_URL}/blog/tags`,
};

const hero = {
  title: 'Dummy Ticket and Visa Topics',
  subtitle: 'Explore topics and read the latest published posts under each tag.',
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
      intro={intro}
      breadcrumbPaths={breadcrumbPaths}
      schema={schema}
      breadcrumbJsonLd={breadcrumbJsonLd}
    />
  );
}
