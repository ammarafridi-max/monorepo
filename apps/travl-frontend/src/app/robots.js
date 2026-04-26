export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/booking',
        '/travel-insurance',
        '/insurance-booking/quote',
        '/insurance-booking/passengers',
        '/insurance-booking/review',
        '/insurance-booking/payment',
      ],
    },
    sitemap: 'https://www.travl.ae/sitemap.xml',
  };
}
