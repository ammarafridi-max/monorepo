import { SITE_URL } from '@/lib/schema';
import { getPublishedBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import { getBlogTagsApi } from '@travel-suite/frontend-shared/services/apiBlogTags';
import { getAuthorsApi } from '@travel-suite/frontend-shared/services/apiAuthors';

// Regenerate hourly so blog and tag entries appear once the backend is reachable
// at runtime (the build-time Docker container usually can't reach it).
export const revalidate = 3600;

const staticPages = [
  { url: '/', changeFrequency: 'weekly', priority: 1.0 },
  { url: '/dubai-airport-transfer', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/dubai-airport-transfer-to-hotel', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/abu-dhabi-airport-transfer', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/abu-dhabi-airport-to-dubai-transfer', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/chauffeur-service', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/chauffeur-service-abu-dhabi', changeFrequency: 'monthly', priority: 0.8 },
  { url: '/hourly-chauffeur', changeFrequency: 'monthly', priority: 0.8 },
  { url: '/car-hire-with-driver-dubai', changeFrequency: 'monthly', priority: 0.8 },
  { url: '/limo-service-dubai', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/dubai-transfer', changeFrequency: 'monthly', priority: 0.8 },
  { url: '/abu-dhabi-to-dubai-transfer', changeFrequency: 'monthly', priority: 0.8 },
  { url: '/dubai-to-abu-dhabi-transfer', changeFrequency: 'monthly', priority: 0.8 },
  { url: '/services', changeFrequency: 'monthly', priority: 0.7 },
  { url: '/fleet', changeFrequency: 'monthly', priority: 0.7 },
  { url: '/about-us', changeFrequency: 'monthly', priority: 0.6 },
  { url: '/contact-us', changeFrequency: 'monthly', priority: 0.6 },
  { url: '/frequently-asked-questions', changeFrequency: 'monthly', priority: 0.6 },
  { url: '/blog', changeFrequency: 'daily', priority: 0.8 },
  { url: '/blog/tags', changeFrequency: 'weekly', priority: 0.6 },
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
    blogEntries = (data?.blogs || [])
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
    const tags = await getBlogTagsApi();
    tagEntries = (tags || [])
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

  let authorEntries = [];
  try {
    const authors = await getAuthorsApi();
    authorEntries = (authors || [])
      .filter((author) => author?.authorProfile?.slug)
      .map((author) => ({
        url: `${SITE_URL}/authors/${author.authorProfile.slug}`,
        lastModified: author.updatedAt || now,
        changeFrequency: 'monthly',
        priority: 0.5,
      }));
  } catch (err) {
    console.error('[sitemap] authors fetch failed:', err);
  }

  return [...staticEntries, ...blogEntries, ...tagEntries, ...authorEntries];
}
