export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/booking', '/insurance-booking'],
    },
    sitemap: 'https://www.dummyticket365.com/sitemap.xml',
  };
}
