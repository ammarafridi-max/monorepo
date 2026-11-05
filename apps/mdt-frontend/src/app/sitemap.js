import { SITE_URL } from '@/lib/schema';
import {
  staticEntries,
  buildContentEntries,
} from '@travel-suite/frontend-shared/seo/sitemap';

export const revalidate = 3600;

const staticPages = [
  { url: '/', changeFrequency: 'weekly', priority: 1.0 },
  { url: '/dummy-ticket-schengen-visa', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/dummy-ticket-us-visa', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/emirates-dummy-ticket', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/etihad-dummy-ticket', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/onward-ticket', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/travel-insurance', changeFrequency: 'monthly', priority: 0.8 },
  { url: '/schengen-travel-insurance', changeFrequency: 'monthly', priority: 0.8 },
  { url: '/blog', changeFrequency: 'daily', priority: 0.8 },
  { url: '/blog/tags', changeFrequency: 'weekly', priority: 0.6 },
  { url: '/affiliate-program', changeFrequency: 'monthly', priority: 0.6 },
  { url: '/faq', changeFrequency: 'monthly', priority: 0.7 },
  { url: '/terms-and-conditions', changeFrequency: 'yearly', priority: 0.3 },
  { url: '/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
];

export default async function sitemap() {
  const now = new Date().toISOString();

  return [
    ...staticEntries({ siteUrl: SITE_URL, pages: staticPages, now }),
    ...(await buildContentEntries(SITE_URL, { now })),
  ];
}
