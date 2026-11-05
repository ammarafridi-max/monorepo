import { SITE_URL } from '@/lib/schema';
import {
  staticEntries,
  buildContentEntries,
} from '@travel-suite/frontend-shared/seo/sitemap';

export const revalidate = 3600;

const staticPages = [
  { url: '/', changeFrequency: 'weekly', priority: 1.0 },
  { url: '/in', changeFrequency: 'weekly', priority: 0.9 },
  { url: '/ca', changeFrequency: 'weekly', priority: 0.9 },
  { url: '/ae', changeFrequency: 'weekly', priority: 0.9 },
  { url: '/uk', changeFrequency: 'weekly', priority: 0.9 },
  { url: '/sa', changeFrequency: 'weekly', priority: 0.9 },
  { url: '/au', changeFrequency: 'weekly', priority: 0.9 },
  { url: '/sg', changeFrequency: 'weekly', priority: 0.9 },
  { url: '/ph', changeFrequency: 'weekly', priority: 0.9 },
  { url: '/de', changeFrequency: 'weekly', priority: 0.9 },
  { url: '/id', changeFrequency: 'weekly', priority: 0.9 },
  { url: '/dummy-ticket-australia-visa', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/dummy-ticket-for-visa', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/verifiable-dummy-ticket', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/multi-city-dummy-ticket', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/dummy-ticket-14-days', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/dummy-ticket-canada-visa', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/dummy-ticket-japan-visa', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/dummy-ticket-schengen-visa', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/dummy-ticket-uk-visa', changeFrequency: 'monthly', priority: 0.9 },
  { url: '/lufthansa-dummy-ticket', changeFrequency: 'monthly', priority: 0.85 },
  { url: '/turkish-airlines-dummy-ticket', changeFrequency: 'monthly', priority: 0.85 },
  { url: '/air-france-dummy-ticket', changeFrequency: 'monthly', priority: 0.85 },
  { url: '/onward-ticket', changeFrequency: 'monthly', priority: 0.9 },
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
