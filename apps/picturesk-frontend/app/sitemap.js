import { SITE_URL } from '../lib/seo';

export default function sitemap() {
  const now = new Date();
  const pages = [
    // The product page is canonical; the root permanently redirects here, so the
    // sitemap lists the destination, not the redirecting '/'.
    { path: '/ai-headshot-generator', changeFrequency: 'weekly', priority: 1 },
    { path: '/faq', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/refunds', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  ];
  return pages.map((p) => ({ url: `${SITE_URL}${p.path}`, lastModified: now, changeFrequency: p.changeFrequency, priority: p.priority }));
}
