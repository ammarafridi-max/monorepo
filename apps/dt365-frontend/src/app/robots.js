export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/booking'],
    },
    sitemap: 'https://www.dummyticket365.com/sitemap.xml',
  };
}
