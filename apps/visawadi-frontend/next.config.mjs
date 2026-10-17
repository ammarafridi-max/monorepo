import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'visawadi.com' }],
        destination: 'https://www.visawadi.com/:path*',
        permanent: true,
      },
      { source: '/visa', destination: '/uae', permanent: true },
      { source: '/visa/:slug', destination: '/uae/visa/:slug', permanent: true },
    ];
  },

  agentRules: false,
  output: 'standalone',
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
