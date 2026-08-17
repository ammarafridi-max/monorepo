import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'visawadi.com' }],
        destination: 'https://www.visawadi.com/:path*',
        permanent: true,
      },
      // Country segmentation. /visa/* predates it and is only days old, so this
      // is the cheapest moment to move it. Anything already linked or crawled
      // lands on the country URL in one hop.
      { source: '/visa', destination: '/uae', permanent: true },
      { source: '/visa/:slug', destination: '/uae/visa/:slug', permanent: true },
    ];
  },

  // `next dev` otherwise appends a block to CLAUDE.md telling agents this is
  // "NOT the Next.js you know" and to trust node_modules/next/dist/docs/ over
  // their own knowledge. Those vendored docs describe APIs that do not exist.
  agentRules: false,
  output: 'standalone',
  // Trace from the monorepo root so workspace packages are included in standalone output
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
