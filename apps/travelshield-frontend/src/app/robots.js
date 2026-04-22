export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.travelshield.ae';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Booking flow pages have no value for search engines
        disallow: ['/insurance-booking'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
