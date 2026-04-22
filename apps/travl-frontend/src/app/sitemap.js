import { SITE_URL } from '@/lib/schema';
import { getPublishedBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import { getBlogTagsApi } from '@travel-suite/frontend-shared/services/apiBlogTags';

const staticPages = [
  { url: '/', changeFrequency: 'weekly', priority: 1.0 },
{ url: '/flight-itinerary', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/travel-insurance', changeFrequency: 'monthly', priority: 0.8 },
  { url: '/travel-insurance/schengen-visa', changeFrequency: 'monthly', priority: 0.8 },
  { url: '/travel-insurance/medical', changeFrequency: 'monthly', priority: 0.8 },
  { url: '/travel-insurance/annual-multi-trip', changeFrequency: 'monthly', priority: 0.8 },
  { url: '/travel-insurance/international', changeFrequency: 'monthly', priority: 0.8 },
  { url: '/travel-insurance/single-trip', changeFrequency: 'monthly', priority: 0.8 },
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
  } catch {
    // Blog API unavailable at build time — blog posts excluded from sitemap
  }

  let tagEntries = [];
  try {
    const data = await getBlogTagsApi();
    const tags = data?.tags || data || [];
    tagEntries = tags
      .filter((tag) => tag?.slug)
      .map((tag) => ({
        url: `${SITE_URL}/blog/tag/${tag.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.5,
      }));
  } catch {
    // Tags API unavailable at build time — tag pages excluded from sitemap
  }

  return [...staticEntries, ...blogEntries, ...tagEntries];
}
