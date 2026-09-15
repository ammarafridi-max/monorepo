/**
 * Offers shown beside and inside a blog post.
 *
 * Emirates Limo sells one product family: private chauffeur-driven rides. The
 * card follows the post's subject, resolved from the slug because tags are
 * broad. Only the hourly service has a public price; every other fare is
 * fixed on the booking form, so the other cards carry no price.
 */

// Order matters: the first token found in the slug wins.
const SERVICE_BY_SLUG_TOKEN = [
  { tokens: ['abu-dhabi-to-dubai-airport', 'abu-dhabi-to-dxb', 'abu-dhabi-to-dwc'], href: '/abu-dhabi-airport-to-dubai-transfer', eyebrow: 'Abu Dhabi to Dubai airport transfer' },
  { tokens: ['auh', 'zayed-international', 'abu-dhabi-airport'], href: '/abu-dhabi-airport-transfer', eyebrow: 'Abu Dhabi airport transfer' },
  { tokens: ['abu-dhabi-to-dubai'], href: '/abu-dhabi-to-dubai-transfer', eyebrow: 'Abu Dhabi to Dubai transfer' },
  { tokens: ['dubai-to-abu-dhabi'], href: '/dubai-to-abu-dhabi-transfer', eyebrow: 'Dubai to Abu Dhabi transfer' },
  { tokens: ['hotel'], href: '/dubai-airport-transfer-to-hotel', eyebrow: 'Airport to hotel transfer' },
  { tokens: ['dxb', 'dwc', 'dubai-airport', 'dubai-international', 'al-maktoum', 'airport'], href: '/dubai-airport-transfer', eyebrow: 'Dubai airport transfer' },
  { tokens: ['hourly', 'by-the-hour', 'day-trip', 'day-out', 'shopping', 'meetings', 'wedding', 'event', 'tour'], href: '/hourly-chauffeur', eyebrow: 'Hourly chauffeur', price: 'From AED 150/hr' },
  { tokens: ['abu-dhabi'], href: '/chauffeur-service-abu-dhabi', eyebrow: 'Abu Dhabi chauffeur service' },
  { tokens: ['limo'], href: '/limo-service-dubai', eyebrow: 'Limo service Dubai' },
  { tokens: ['car-hire', 'car-with-driver', 'rental'], href: '/car-hire-with-driver-dubai', eyebrow: 'Car hire with driver' },
  { tokens: ['transfer'], href: '/dubai-transfer', eyebrow: 'Dubai transfer' },
];

function resolveService(blog) {
  const slug = String(blog?.slug || '').toLowerCase();
  const match = SERVICE_BY_SLUG_TOKEN.find((entry) => entry.tokens.some((token) => slug.includes(token)));
  return match || { href: '/chauffeur-service', eyebrow: 'Chauffeur service Dubai' };
}

/** Cards for the sticky rail. */
export function getBlogOffers(blog) {
  const service = resolveService(blog);

  return [
    {
      id: 'service',
      tone: 'brand',
      eyebrow: service.eyebrow,
      ...(service.price ? { price: service.price } : {}),
      note: 'Private chauffeur-driven car, fixed price at booking, free cancellation up to 24 hours before pickup.',
      href: service.href,
      cta: 'Get a fixed quote',
    },
    {
      id: 'fleet',
      tone: 'plain',
      eyebrow: 'Our fleet',
      note: 'Sedans for up to four, the GMC Yukon for six, and vans for groups with luggage.',
      href: '/fleet',
      cta: 'View fleet',
    },
  ];
}

/** The single mid-article unit. */
export function getBlogInlineOffer(blog) {
  const service = resolveService(blog);
  return {
    headline: 'Want the car waiting when you land?',
    note: 'Name board in arrivals, flight tracking and 60 minutes of free waiting time, all at a price fixed when you book.',
    href: service.href,
    cta: 'Get a fixed quote',
  };
}
