/**
 * Offers shown beside and inside a blog post.
 *
 * Dummy Ticket 365 sells one thing: flight reservations with a real PNR from
 * USD 13. The card follows the post's subject, resolved from the slug because
 * tags never name a destination or airline.
 */

// Order matters: the first token found in the slug wins.
const TICKET_BY_SLUG_TOKEN = [
  { tokens: ['turkish'], href: '/turkish-airlines-dummy-ticket', eyebrow: 'Turkish Airlines dummy ticket' },
  { tokens: ['lufthansa'], href: '/lufthansa-dummy-ticket', eyebrow: 'Lufthansa dummy ticket' },
  { tokens: ['air-france'], href: '/air-france-dummy-ticket', eyebrow: 'Air France dummy ticket' },
  { tokens: ['schengen'], href: '/dummy-ticket-schengen-visa', eyebrow: 'Dummy ticket for Schengen visa' },
  { tokens: ['uk-visa', 'united-kingdom'], href: '/dummy-ticket-uk-visa', eyebrow: 'Dummy ticket for UK visa' },
  { tokens: ['canada'], href: '/dummy-ticket-canada-visa', eyebrow: 'Dummy ticket for Canada visa' },
  { tokens: ['australia'], href: '/dummy-ticket-australia-visa', eyebrow: 'Dummy ticket for Australia visa' },
  { tokens: ['japan'], href: '/dummy-ticket-japan-visa', eyebrow: 'Dummy ticket for Japan visa' },
  { tokens: ['onward', 'return-ticket', 'proof-of-onward'], href: '/onward-ticket', eyebrow: 'Onward ticket' },
  { tokens: ['itinerary'], href: '/flight-itinerary', eyebrow: 'Flight itinerary' },
];

function resolveTicket(blog) {
  const slug = String(blog?.slug || '').toLowerCase();
  const match = TICKET_BY_SLUG_TOKEN.find((entry) => entry.tokens.some((token) => slug.includes(token)));
  return match
    ? { href: match.href, eyebrow: match.eyebrow }
    : { href: '/', eyebrow: 'Dummy ticket' };
}

/** Cards for the sticky rail. */
export function getBlogOffers(blog) {
  const ticket = resolveTicket(blog);

  return [
    {
      id: 'dummy-ticket',
      tone: 'brand',
      eyebrow: ticket.eyebrow,
      price: 'From USD 13',
      note: 'A real flight reservation with a verifiable PNR, delivered by email in minutes.',
      href: ticket.href,
      cta: 'Get your ticket',
    },
  ];
}

/** The single mid-article unit. */
export function getBlogInlineOffer(blog) {
  const ticket = resolveTicket(blog);
  return {
    headline: 'Need proof of onward travel?',
    note: 'A real PNR you can show the embassy or the airline from USD 13, without buying a ticket you might not use.',
    href: ticket.href,
    cta: 'Get your ticket',
  };
}
