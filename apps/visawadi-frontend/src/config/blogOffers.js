/**
 * Conversion units rendered alongside blog posts.
 *
 * VisaWadi sells one thing: visa application assistance. So the primary offer
 * is always a visa page, matched to whatever destination the post is about.
 *
 * Proof of onward travel is the one exception. Applicants genuinely need it and
 * we do not sell it, so those posts point at Dummy Ticket 365 rather than
 * pretending we can help. That is a deliberate outbound referral.
 */

const DUMMY_TICKET_URL = 'https://www.dummyticket365.com';

/** Slug token -> visa page. Order matters: first match wins, so the specific
 *  country slugs must be tested before the generic Schengen fallback. */
const VISA_BY_SLUG_TOKEN = [
  { tokens: ['france'], href: '/visa/france-visa', label: 'France visa' },
  { tokens: ['germany'], href: '/visa/germany-visa', label: 'Germany visa' },
  { tokens: ['italy'], href: '/visa/italy-visa', label: 'Italy visa' },
  { tokens: ['spain'], href: '/visa/spain-visa', label: 'Spain visa' },
  { tokens: ['uk-visa', 'united-kingdom'], href: '/visa/united-kingdom', label: 'UK visa' },
  { tokens: ['usa', 'us-visa', 'b1b2'], href: '/visa/usa', label: 'US visa' },
  { tokens: ['canada'], href: '/visa/canada', label: 'Canada visa' },
  { tokens: ['schengen', 'netherlands', 'switzerland', 'greece'], href: '/visa/schengen', label: 'Schengen visa' },
];

/** Pick the visa page closest to the post's subject, defaulting to the hub. */
function resolveVisa(blog) {
  const slug = String(blog?.slug || '').toLowerCase();
  const match = VISA_BY_SLUG_TOKEN.find((entry) =>
    entry.tokens.some((token) => slug.includes(token)),
  );

  return match
    ? {
        href: match.href,
        eyebrow: match.label,
        note: 'Document review, file preparation and appointment booking, tracked until a decision.',
      }
    : {
        href: '/visa',
        eyebrow: 'Visa assistance',
        note: 'Every document checked against current embassy requirements before you submit.',
      };
}

function isOnwardTravelPost(blog) {
  const tags = blog?.tags || [];
  const names = tags.map((t) => t?.name || t);
  const slug = String(blog?.slug || '').toLowerCase();
  return (
    names.includes('Dummy Ticket') ||
    names.includes('Flight Itinerary') ||
    slug.includes('dummy-ticket') ||
    slug.includes('pnr') ||
    slug.includes('onward') ||
    slug.includes('real-ticket')
  );
}

/** Cards for the sticky rail. Own product first. */
export function getBlogOffers(blog) {
  const visa = resolveVisa(blog);

  const offers = [
    {
      id: 'visa',
      tone: 'brand',
      eyebrow: visa.eyebrow,
      price: 'From AED 299',
      note: visa.note,
      href: visa.href,
      cta: 'Get free consultation',
    },
  ];

  if (isOnwardTravelPost(blog)) {
    offers.push({
      id: 'onward-travel',
      tone: 'plain',
      eyebrow: 'Proof of onward travel',
      note: 'A real flight reservation with a verifiable PNR, without buying a ticket.',
      href: DUMMY_TICKET_URL,
      cta: 'Dummy Ticket 365',
      external: true,
    });
  }

  return offers;
}

/** The single mid-article unit. Matches the post's subject where it can. */
export function getBlogInlineOffer(blog) {
  if (isOnwardTravelPost(blog)) {
    return {
      headline: 'Need proof of onward travel?',
      note: 'A real PNR you can show the embassy, without buying a ticket you might not use.',
      href: DUMMY_TICKET_URL,
      cta: 'Get one',
      external: true,
    };
  }

  const visa = resolveVisa(blog);
  return {
    headline: 'Want someone to check your file first?',
    note: 'We review every document against current embassy requirements and flag what causes refusals.',
    href: visa.href,
    cta: 'Get free consultation',
  };
}
