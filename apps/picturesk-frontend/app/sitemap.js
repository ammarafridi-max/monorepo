import { getPublishedBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import { getBlogTagsApi } from '@travel-suite/frontend-shared/services/apiBlogTags';
import { getAuthorsApi } from '@travel-suite/frontend-shared/services/apiAuthors';
import { SITE_URL } from '../lib/seo';

// Revalidated hourly so a newly published post reaches the sitemap without a deploy.
export const revalidate = 3600;

const PAGES = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/ai-headshot-generator', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/tools/linkedin-photo-analyzer', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/pricing', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/linkedin-headshots', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/real-estate-agent-headshots', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/ai-headshots-vs-photographer', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/ai-dating-photos', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/hinge-photos', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/tinder-photos', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/bumble-photos', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/dating-profile-photos-for-men', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/ai-dating-photos-vs-photographer', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/blog', changeFrequency: 'daily', priority: 0.8 },
  { path: '/blog/tags', changeFrequency: 'weekly', priority: 0.6 },
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

  let tags = [];
  try {
    const data = await getBlogTagsApi();
    tags = (data?.tags || data || [])
      .filter((tag) => tag?.slug)
      .map((tag) => ({
        url: `${SITE_URL}/blog/tags/${tag.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.5,
      }));
  } catch {}

  let authors = [];
  try {
    const data = await getAuthorsApi();
    authors = (data || [])
      .filter((author) => author?.authorProfile?.slug)
      .map((author) => ({
        url: `${SITE_URL}/authors/${author.authorProfile.slug}`,
        lastModified: new Date(author.updatedAt || now),
        changeFrequency: 'monthly',
        priority: 0.5,
      }));
  } catch {}

  return [
    ...PAGES.map((p) => ({
      url: `${SITE_URL}${p.path}`,
      lastModified: now,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),
    ...posts,
    ...tags,
    ...authors,
  ];
}
