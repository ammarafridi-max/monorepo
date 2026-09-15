import { SITE_URL } from '@/lib/schema';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/book', '/payment'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
