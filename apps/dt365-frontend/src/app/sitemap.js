import { SITE_URL } from '@/lib/schema';
import { getPublishedBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import { getBlogTagsApi } from '@travel-suite/frontend-shared/services/apiBlogTags';

// Regenerate hourly so blog/tag entries appear once the backend is reachable
// at runtime (the build-time Docker container usually can't reach it).
export const revalidate = 3600;

const staticPages = [
  { url: '/', changeFrequency: 'weekly', priority: 1.0 },
  { url: '/dummy-ticket-australia-visa', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/dummy-ticket-canada-visa', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/dummy-ticket-japan-visa', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/dummy-ticket-schengen-visa', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/dummy-ticket-uk-visa', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/onward-ticket', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/flight-itinerary', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/blog', changeFrequency: 'daily', priority: 0.8 },
  { url: '/blog/tags', changeFrequency: 'weekly', priority: 0.6 },
  { url: '/faq', changeFrequency: 'monthly', priority: 0.7 },
  { url: '/terms-and-conditions', changeFrequency: 'yearly', priority: 0.3 },
  { url: '/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
];

export default async function sitemap() {
  const now = new Date().toISOString();

  const staticEntries = staticPages.map(({ url, changeFrequency, priority }) => ({
    url: `${SITE_URL}${url}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  let blogEntries = [];
  try {
    const data = await getPublishedBlogsApi({ page: 1, limit: 1000 });
    const blogs = data?.blogs || [];
    blogEntries = blogs
      .filter((blog) => blog?.slug)
      .map((blog) => ({
        url: `${SITE_URL}/blog/${blog.slug}`,
        lastModified: blog.updatedAt || blog.createdAt || now,
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
  } catch (err) {
    console.error('[sitemap] blog posts fetch failed:', err);
  }

  let tagEntries = [];
  try {
    const data = await getBlogTagsApi();
    const tags = data?.tags || data || [];
    tagEntries = tags
      .filter((tag) => tag?.slug)
      .map((tag) => ({
        url: `${SITE_URL}/blog/tags/${tag.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.5,
      }));
  } catch (err) {
    console.error('[sitemap] blog tags fetch failed:', err);
  }

  return [...staticEntries, ...blogEntries, ...tagEntries];
}
