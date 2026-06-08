export const dynamic = 'force-static';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/book/', '/payment', '/admin/'],
      },
    ],
    sitemap: 'https://www.emirateslimo.com/sitemap.xml',
  };
}
