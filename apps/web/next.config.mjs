import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import dotenv from 'dotenv';
import { withSentryConfig } from '@sentry/nextjs';

// Same root env pattern as the Node services (api/worker) and the diag scripts:
// one per-environment file for the whole monorepo, selected by NODE_ENV
// (.env.development locally, .env.production for build/start). Loaded here so
// server code (route handlers, server components) reads MONGODB_URI / AUTH_SECRET /
// GOOGLE_CLIENT_ID, and NEXT_PUBLIC_* stays inlined at build. On Fly the file is
// absent and dotenv does not override the injected secrets, so prod is unaffected.
dotenv.config({
  path: resolve(
    dirname(fileURLToPath(import.meta.url)),
    `../../.env.${process.env.NODE_ENV || 'development'}`,
  ),
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Canonical host is www.picturesk.ai. Any request that arrives on the bare apex
  // (picturesk.ai) is 308-redirected to the www host, preserving the path. Matches
  // on the Host header, so it never touches fly.dev or localhost traffic.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'picturesk.ai' }],
        destination: 'https://www.picturesk.ai/:path*',
        permanent: true,
      },
      // The funnel moved under /ai-headshot-generator (and /pay -> /payment).
      // Permanent-redirect the old URLs so bookmarks and any in-flight Stripe
      // cancel_urls do not 404.
      { source: '/generator/select', destination: '/ai-headshot-generator/select', permanent: true },
      { source: '/generator/upload', destination: '/ai-headshot-generator/upload', permanent: true },
      { source: '/generator/pay', destination: '/ai-headshot-generator/payment', permanent: true },
      { source: '/generator/capture', destination: '/ai-headshot-generator/capture', permanent: true },
    ];
  },
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
