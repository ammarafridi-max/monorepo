import { SITE_URL } from '@/lib/schema';
import {
  staticEntries,
  buildContentEntries,
} from '@travel-suite/frontend-shared/seo/sitemap';

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

  return [
    ...staticEntries({ siteUrl: SITE_URL, pages: staticPages, now }),
    ...(await buildContentEntries(SITE_URL, { now })),
  ];
}
