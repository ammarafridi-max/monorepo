import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import dotenv from 'dotenv';
import { withSentryConfig } from '@sentry/nextjs';

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
    serverComponentsExternalPackages: ['@picturesk/shared', 'mongoose', 'bcryptjs'],
    // Required on Next 14 so instrumentation.js (the Sentry bootstrap) runs.
    instrumentationHook: true,
  },
};

// Only wrap the build with Sentry when a DSN is configured at build time. With no
// DSN the build is untouched (no Sentry client code bundled), so local dev stays
// lean; the config files also no-op at runtime. The client DSN is a NEXT_PUBLIC_
// (build-time) value by necessity.
const sentryConfigured = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);

export default sentryConfigured
  ? withSentryConfig(nextConfig, {
      // Source-map upload only happens when org/project/authToken are present;
      // without them the build still succeeds, just without uploaded maps.
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      disableLogger: true,
    })
  : nextConfig;
