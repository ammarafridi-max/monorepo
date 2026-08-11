import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
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
