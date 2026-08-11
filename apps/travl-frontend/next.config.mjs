import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));


// Visa posts that moved to VisaWadi when the brands split. Travl is insurance
// only now. Slugs are identical on both sides, so each is a straight swap.
// Insurance posts are NOT here and continue to be served by Travl.
const MOVED_TO_VISAWADI = [
  'schengen-visa-fees-in-2026-complete-cost-breakdown-for-uae-applicants',
  'how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide',
  'how-long-does-a-schengen-visa-take-to-process-from-dubai',
  'schengen-visa-documents-checklist-for-uae-residents',
  'schengen-visa-rejection-top-10-reasons-and-how-to-avoid-them',
  'schengen-visa-bank-statement-requirements-for-uae-residents',
  'schengen-visa-interview-questions-how-to-prepare-from-the-uae',
  'single-entry-vs-multiple-entry-schengen-visa-which-one-should-you-get',
  'schengen-visa-for-first-time-applicants-how-to-prove-strong-ties-to-the-uae',
  'proof-of-accommodation-for-schengen-visa-what-uae-applicants-need',
  'proof-of-onward-travel-for-schengen-visa-why-dummy-tickets-work',
  'vfs-global-dubai-booking-appointments-and-what-to-expect',
  'bls-international-uae-schengen-visa-application-guide',
  'france-visa-from-uae-application-process-documents-and-tips',
  'germany-visa-from-uae-step-by-step-application-guide',
  'italy-visa-from-uae-requirements-and-application-process',
  'netherlands-visa-from-uae-documents-and-process-explained',
  'switzerland-visa-from-uae-requirements-for-schengen-applicants',
  'greece-visa-from-uae-how-to-apply-and-what-to-expect',
  'uk-visa-from-uae-standard-visitor-visa-application-guide',
  'usa-b1b2-visa-from-uae-complete-application-guide',
  'usa-visa-interview-at-the-dubai-embassy-questions-and-tips',
  'australia-visitor-visa-from-uae-subclass-600-explained',
  'china-visa-from-uae-tourist-visa-application-process',
  'india-visa-from-uae-e-visa-vs-sticker-visa-explained',
  'vietnam-visa-from-uae-e-visa-and-visa-on-arrival-guide',
  'malaysia-visa-from-uae-requirements-for-uae-residents',
  'south-korea-visa-from-uae-documents-and-application-tips',
  'why-buying-a-real-ticket-before-your-visa-is-approved-is-a-risky-move',
  'pnr-codes-explained-what-they-are-and-how-visa-officers-verify-them',
];

// Dead or renamed paths, each pointing at its live canonical in a single hop.
const LEGACY_REDIRECTS = [
  ['/blog/how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide-2',
   'https://www.visawadi.com/blog/how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide'],
  ['/blog/schengen-visa-travel-insurance-requirements-minimum-coverage-explained-2',
   '/blog/schengen-visa-travel-insurance-requirements-minimum-coverage-explained'],
  ['/blog/why-you-need-travel-insurance-for-your-schengen-visa-application',
   '/blog/why-travel-insurance-is-mandatory-for-a-schengen-visa-and-what-coverage-you-need'],
  ['/flight-itinerary', '/travel-itinerary'],
  ['/terms', '/terms-and-conditions'],
  ['/privacy', '/privacy-policy'],
  ['/schengen-travel-insurance', '/travel-insurance/schengen-visa'],
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // `next dev` otherwise appends a block to CLAUDE.md telling agents this is
  // "NOT the Next.js you know" and to trust node_modules/next/dist/docs/ over
  // their own knowledge. Those vendored docs describe APIs that do not exist.
  agentRules: false,
  output: 'standalone',
  // Trace from the monorepo root so workspace packages are included in standalone output
  outputFileTracingRoot: join(__dirname, '../../'),
  async redirects() {
    return [
      ...MOVED_TO_VISAWADI.map((slug) => ({
        source: `/blog/${slug}`,
        destination: `https://www.visawadi.com/blog/${slug}`,
        permanent: true,
      })),
      ...LEGACY_REDIRECTS.map(([source, destination]) => ({ source, destination, permanent: true })),
      { source: '/blog/tag/:slug', destination: '/blog/tags/:slug', permanent: true },
      // Visa assistance moved to VisaWadi. Slugs match one-for-one on both sides.
      // NOTE: /travel-insurance/*-visa pages are insurance products and stay here.
      // Straight to the country URL. Pointing at /visa/:slug and letting
      // VisaWadi redirect again would be a two-hop chain, which Google discounts.
      { source: '/visa', destination: 'https://www.visawadi.com/uae', permanent: true },
      { source: '/visa/:slug', destination: 'https://www.visawadi.com/uae/visa/:slug', permanent: true },
      // Customer document-upload flow moved with it. Magic links already sent
      // point here, so keep the path shape.
      { source: '/apply', destination: 'https://www.visawadi.com/apply', permanent: true },
      { source: '/apply/:path*', destination: 'https://www.visawadi.com/apply/:path*', permanent: true },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'travl.ae' }],
        destination: 'https://www.travl.ae/:path*',
        permanent: true,
      },
    ];
  },
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
