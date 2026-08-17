/**
 * Offers shown beside and inside a blog post.
 *
 * Brand-specific by design: the shared BlogPostPage renders whatever it is
 * given and nothing if it is given nothing, so no other brand inherits Travl's
 * products.
 *
 * The insurance card follows the post. Blog tags are broad ("Schengen Visa",
 * "Visa Documents") and never name a country, so the destination is resolved
 * from the slug, which does. Anything unmatched falls back to the Schengen
 * landing page for visa posts and the index for everything else — both real
 * pages, never a 404.
 */

import { DUMMY_TICKET_365 } from './partners.js';

const DUMMY_TICKET_URL = DUMMY_TICKET_365.url;

// Only routes that exist under /travel-insurance. Order matters: the first
// token found in the slug wins, so put the specific ones first.
const INSURANCE_BY_SLUG_TOKEN = [
  ['germany', 'germany-visa'],
  ['france', 'france-visa'],
  ['spain', 'spain-visa'],
  ['italy', 'italy-visa'],
  ['greece', 'greece-visa'],
  ['switzerland', 'switzerland-visa'],
  ['netherlands', 'netherlands-visa'],
  ['austria', 'austria-visa'],
  ['australia', 'australia-visa'],
  ['canada', 'canada-visa'],
  ['united-kingdom', 'uk-visa'],
  ['uk-visa', 'uk-visa'],
  ['the-uk', 'uk-visa'],
  ['usa', 'us-visa'],
  ['b1b2', 'us-visa'],
  ['bali', 'indonesia'],
  ['indonesia', 'indonesia'],
  ['schengen', 'schengen-visa'],
  ['medical-tourism', 'medical'],
  ['pregnant', 'medical'],
  ['digital-nomads', 'annual-multi-trip'],
  ['working-holidays', 'annual-multi-trip'],
  ['annual', 'annual'],
  ['family', 'family'],
];

const COUNTRY_LABEL = {
  'germany-visa': 'Germany',
  'france-visa': 'France',
  'spain-visa': 'Spain',
  'italy-visa': 'Italy',
  'greece-visa': 'Greece',
  'switzerland-visa': 'Switzerland',
  'netherlands-visa': 'Netherlands',
  'austria-visa': 'Austria',
  'australia-visa': 'Australia',
  'canada-visa': 'Canada',
  'uk-visa': 'UK',
  'us-visa': 'US',
  'schengen-visa': 'Schengen',
};

function resolveInsurance(blog) {
  const slug = String(blog?.slug || '').toLowerCase();
  const match = INSURANCE_BY_SLUG_TOKEN.find(([token]) => slug.includes(token));

  if (match) {
    const [, route] = match;
    const country = COUNTRY_LABEL[route];
    return {
      href: `/travel-insurance/${route}`,
      eyebrow: country ? `${country} travel insurance` : 'Travel insurance',
      note: country
        ? `Cover that meets ${country} visa requirements, issued instantly by AXA.`
        : 'AXA-backed cover, issued the same day.',
    };
  }

  // Visa posts without a dedicated insurance page still want a visa-grade
  // policy; everything else gets the index.
  const isVisaPost = slug.includes('visa') || (blog?.tags || []).includes('Visa Documents');
  return isVisaPost
    ? {
        href: '/travel-insurance/schengen-visa',
        eyebrow: 'Travel insurance',
        note: 'Visa-compliant cover, issued instantly by AXA.',
      }
    : {
        href: '/travel-insurance',
        eyebrow: 'Travel insurance',
        note: 'AXA-backed cover for UAE residents, issued the same day.',
      };
}

/** Cards for the sticky rail, brand product first. */
export function getBlogOffers(blog) {
  const insurance = resolveInsurance(blog);

  return [
    {
      id: 'insurance',
      tone: 'brand',
      eyebrow: insurance.eyebrow,
      price: 'From AED 30',
      note: insurance.note,
      href: insurance.href,
      cta: 'Get insured',
    },
    {
      id: 'dummy-ticket',
      tone: 'plain',
      eyebrow: 'Dummy ticket',
      price: `From ${DUMMY_TICKET_365.fromPrice}`,
      note: `A real flight reservation with a verifiable PNR, issued by ${DUMMY_TICKET_365.name} and delivered by email in minutes.`,
      href: DUMMY_TICKET_URL,
      cta: DUMMY_TICKET_365.name,
      external: true,
    },
  ];
}

/** The single mid-article unit. Matches the post's subject where it can. */
export function getBlogInlineOffer(blog) {
  const tags = blog?.tags || [];
  const slug = String(blog?.slug || '').toLowerCase();
  const isTicketPost =
    tags.includes('Dummy Ticket') ||
    tags.includes('Flight Itinerary') ||
    slug.includes('dummy-ticket') ||
    slug.includes('flight') ||
    slug.includes('pnr') ||
    slug.includes('onward');

  if (isTicketPost) {
    return {
      headline: 'Need proof of onward travel?',
      note: `A real PNR you can show the embassy, from ${DUMMY_TICKET_365.fromPrice} via ${DUMMY_TICKET_365.name}, without buying a ticket.`,
      href: DUMMY_TICKET_URL,
      cta: 'Order one',
      external: true,
    };
  }

  const insurance = resolveInsurance(blog);
  return {
    headline: 'Sort your travel insurance first',
    note: `${insurance.note} From AED 30.`,
    href: insurance.href,
    cta: 'Get insured',
  };
}
