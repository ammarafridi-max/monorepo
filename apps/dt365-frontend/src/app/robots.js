export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/booking',
        '/travel-insurance',
        '/payment-successful',
      ],
    },
    sitemap: 'https://www.dummyticket365.com/sitemap.xml',
  };
}
