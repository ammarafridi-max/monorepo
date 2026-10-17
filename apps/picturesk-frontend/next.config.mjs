import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'picturesk.ai' }],
        destination: 'https://www.picturesk.ai/:path*',
        permanent: true,
      },
      { source: '/generator/select', destination: '/ai-headshot-generator/select', permanent: true },
      { source: '/generator/upload', destination: '/ai-headshot-generator/upload', permanent: true },
      { source: '/generator/pay', destination: '/ai-headshot-generator/payment', permanent: true },
      { source: '/generator/capture', destination: '/ai-headshot-generator/capture', permanent: true },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      ...(process.env.NEXT_PUBLIC_IMAGE_HOST
        ? [{ protocol: 'https', hostname: process.env.NEXT_PUBLIC_IMAGE_HOST }]
        : []),
    ],
  },
  serverExternalPackages: ['@travel-suite/picturesk-shared', 'mongoose', 'bcryptjs'],
  output: 'standalone',
  outputFileTracingRoot: resolve(dirname(fileURLToPath(import.meta.url)), '../..'),
};

const sentryConfigured = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);

export default sentryConfigured
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
    })
  : nextConfig;
