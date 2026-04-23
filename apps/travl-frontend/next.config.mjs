import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Trace from the monorepo root so workspace packages are included in standalone output
  outputFileTracingRoot: join(__dirname, '../../'),
  transpilePackages: ['@travel-suite/frontend-shared'],
};

export default nextConfig;
