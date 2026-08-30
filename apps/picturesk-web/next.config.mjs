import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { withSentryConfig } from '@sentry/nextjs';

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
  serverExternalPackages: ['@travel-suite/picturesk-shared', 'mongoose', 'bcryptjs'],
  // Self-contained server bundle, so the Docker image does not ship node_modules.
  output: 'standalone',
  // The app lives in a monorepo, so tracing must start at the repo root or the
  // standalone output misses the linked workspace packages.
  outputFileTracingRoot: resolve(dirname(fileURLToPath(import.meta.url)), '../..'),
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
    })
  : nextConfig;
