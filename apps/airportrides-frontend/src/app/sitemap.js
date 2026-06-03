import { SITE_URL } from '@/config';

const staticPages = [
  { url: '/', changeFrequency: 'weekly', priority: 1.0 },
  { url: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { url: '/blog', changeFrequency: 'daily', priority: 0.8 },
  { url: '/faq', changeFrequency: 'monthly', priority: 0.7 },
  { url: '/contact', changeFrequency: 'yearly', priority: 0.5 },
  { url: '/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
  { url: '/terms-and-conditions', changeFrequency: 'yearly', priority: 0.3 },
];

export default async function sitemap() {
  const now = new Date().toISOString();

  const staticEntries = staticPages.map(({ url, changeFrequency, priority }) => ({
    url: `${SITE_URL}${url}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  // Airport landing pages and blog entries will be appended here once those
  // routes and APIs exist. Keep the async signature so additions stay simple.
  return [...staticEntries];
}
