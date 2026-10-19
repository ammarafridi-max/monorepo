import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/travel-insurance/schengen-visa',
        destination: '/schengen-travel-insurance',
        permanent: true,
      },
      {
        source:
          '/travel-insurance/:plan(medical|international|annual-multi-trip|single-trip)',
        destination: '/travel-insurance',
        permanent: true,
      },
      {
        source: '/blog/tag/:slug',
        destination: 'https://www.mydummyticket.ae/blog/tags/:slug',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'mydummyticket.ae' }],
        destination: 'https://www.mydummyticket.ae/:path*',
        permanent: true,
      },
    ];
  },
  outputFileTracingRoot: join(__dirname, '../../'),
  transpilePackages: ['@travel-suite/frontend-shared', '@travel-suite/config'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
