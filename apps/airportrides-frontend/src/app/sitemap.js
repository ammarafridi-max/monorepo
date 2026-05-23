import { SITE_URL } from '@/config';

const staticPages = [
  { url: '/', changeFrequency: 'weekly', priority: 1.0 },
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
