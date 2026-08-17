import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [
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
  transpilePackages: ['@travel-suite/frontend-shared'],
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
