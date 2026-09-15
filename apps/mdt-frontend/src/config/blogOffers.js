/**
 * Offers shown beside and inside a blog post.
 *
 * My Dummy Ticket sells two things: dummy tickets from AED 49 and AXA travel
 * insurance from AED 30. The ticket card follows the post's subject, resolved
 * from the slug because tags never name a destination or airline.
 */

// Order matters: the first token found in the slug wins.
const TICKET_BY_SLUG_TOKEN = [
  { tokens: ['etihad'], href: '/etihad-dummy-ticket', eyebrow: 'Etihad dummy ticket' },
  { tokens: ['emirates-'], href: '/emirates-dummy-ticket', eyebrow: 'Emirates dummy ticket' },
  { tokens: ['schengen'], href: '/dummy-ticket-schengen-visa', eyebrow: 'Dummy ticket for Schengen visa' },
  { tokens: ['us-visa', 'usa', 'b1b2'], href: '/dummy-ticket-us-visa', eyebrow: 'Dummy ticket for US visa' },
  { tokens: ['onward', 'return-ticket', 'proof-of-onward'], href: '/onward-ticket', eyebrow: 'Onward ticket' },
  { tokens: ['itinerary'], href: '/flight-itinerary', eyebrow: 'Flight itinerary' },
];

const tagNames = (blog) =>
  (blog?.tags || []).map((t) => (typeof t === 'string' ? t : t?.name)).filter(Boolean);

function resolveTicket(blog) {
  const slug = String(blog?.slug || '').toLowerCase();
  const match = TICKET_BY_SLUG_TOKEN.find((entry) => entry.tokens.some((token) => slug.includes(token)));
  return match
    ? { href: match.href, eyebrow: match.eyebrow }
    : { href: '/', eyebrow: 'Dummy ticket' };
}

function isInsurancePost(blog) {
  const slug = String(blog?.slug || '').toLowerCase();
  return tagNames(blog).includes('Travel Insurance') || slug.includes('insurance');
}

function resolveInsurance(blog) {
  const slug = String(blog?.slug || '').toLowerCase();
  return slug.includes('schengen')
    ? { href: '/schengen-travel-insurance', eyebrow: 'Schengen travel insurance' }
    : { href: '/travel-insurance', eyebrow: 'Travel insurance' };
}

/** Cards for the sticky rail, brand product first. */
export function getBlogOffers(blog) {
  const ticket = resolveTicket(blog);
  const insurance = resolveInsurance(blog);

  return [
    {
      id: 'dummy-ticket',
      tone: 'brand',
      eyebrow: ticket.eyebrow,
      price: 'From AED 49',
      note: 'A real airline reservation with a verifiable PNR, delivered by email in 10 to 15 minutes.',
      href: ticket.href,
      cta: 'Get your ticket',
    },
    {
      id: 'insurance',
      tone: 'plain',
      eyebrow: insurance.eyebrow,
      price: 'From AED 30',
      note: 'AXA-backed cover that meets Schengen visa requirements, issued the same day.',
      href: insurance.href,
      cta: 'Get insured',
    },
  ];
}

/** The single mid-article unit. Matches the post's subject where it can. */
export function getBlogInlineOffer(blog) {
  if (isInsurancePost(blog)) {
    const insurance = resolveInsurance(blog);
    return {
      headline: 'Need visa-compliant travel insurance?',
      note: 'AXA-backed cover from AED 30, issued the same day and accepted by VFS and BLS.',
      href: insurance.href,
      cta: 'Get insured',
    };
  }

  const ticket = resolveTicket(blog);
  return {
    headline: 'Need proof of a booked flight?',
    note: 'A verifiable PNR for your visa file from AED 49, without paying for a ticket you might not use.',
    href: ticket.href,
    cta: 'Get your ticket',
  };
}
