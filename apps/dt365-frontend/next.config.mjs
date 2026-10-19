import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/blog/what-is-a-pnr-in-flight-reservations-and-how-does-it-work',
        destination: '/verifiable-dummy-ticket',
        permanent: true,
      },
      {
        source: '/blog/tag/:slug',
        destination: 'https://www.dummyticket365.com/blog/tags/:slug',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'dummyticket365.com' }],
        destination: 'https://www.dummyticket365.com/:path*',
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
