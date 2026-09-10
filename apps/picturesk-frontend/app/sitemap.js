import { getPublishedBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import { SITE_URL } from '../lib/seo';

// Revalidated hourly so a newly published post reaches the sitemap without a deploy.
export const revalidate = 3600;

const PAGES = [
  // The product page is canonical; the root permanently redirects here, so the
  // sitemap lists the destination, not the redirecting '/'.
  { path: '/ai-headshot-generator', changeFrequency: 'weekly', priority: 1 },
  { path: '/blog', changeFrequency: 'daily', priority: 0.8 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/refunds', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
];

export default async function sitemap() {
  const now = new Date();

  let posts = [];
  try {
    const data = await getPublishedBlogsApi({ page: 1, limit: 1000 });
    posts = (data?.blogs || [])
      .filter((post) => post?.slug)
      .map((post) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt || post.publishedAt || now),
        changeFrequency: 'monthly',
        priority: 0.7,
      }));
  } catch {
    // An api blip must not break the sitemap; the static pages still ship.
  }

  return [
    ...PAGES.map((p) => ({
      url: `${SITE_URL}${p.path}`,
      lastModified: now,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),
    ...posts,
  ];
}
