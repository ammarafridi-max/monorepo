import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import dotenv from 'dotenv';

// Same root-.env pattern as the Node services (api/worker): one .env for the whole
// monorepo. Loaded here so server code (route handlers, server components) reads
// MONGODB_URI / AUTH_SECRET, and NEXT_PUBLIC_* stays inlined at build.
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep these server-only packages out of the bundler (mongoose in particular
  // misbehaves when bundled). They load from node_modules at runtime, on the
  // Node.js server only.
  experimental: {
    serverComponentsExternalPackages: ['@headliner/shared', 'mongoose', 'bcryptjs'],
  },
};

export default nextConfig;
