import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: join(__dirname, '../../'),
  transpilePackages: ['@travel-suite/frontend-shared'],
};

export default nextConfig;
