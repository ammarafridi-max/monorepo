/**
 * The Dummy Ticket AE — flight reservations and travel insurance, sold direct.
 *
 * The inverse of the VisaWadi target: here the products are ours, so the rules
 * below are about not overclaiming rather than not misattributing. Two hard
 * failures are worth knowing up front. Visa assistance is not a service yet and
 * a post that offers it writes a promise we cannot keep. And no sister brand may
 * be named or linked: each site in this group speaks only for itself.
 */

const SITE = 'https://www.thedummyticket.ae';
const page = (slug) => `${SITE}/${slug}`;

export const TARGET = {
  key: 'thedt',
  name: 'The Dummy Ticket AE',
  backendUrl: 'https://api.thedummyticket.ae',
  siteUrl: SITE,

  adminEmailEnv: 'THEDT_ADMIN_EMAIL',
  adminPasswordEnv: 'THEDT_ADMIN_PASSWORD',

  ctaClass: 'thedt-cta',

  excludedTags: ['Visa Assistance', 'Airport Transfers'],

  /** First slot for blog-schedule, and posts it must leave where they are. */
  blogSchedule: {
    start: '2026-09-25T05:00:00Z', // 09:00 GST
    excludeSlugs: [],
  },

  formatsByTier: {
    short: 'quick-answer',
    medium: 'sourced-guide',
    long: 'sourced-guide',
  },

  /**
   * Official sources only. Entry rules and visa requirements are YMYL topics:
   * a confident claim sourced to a travel blog is worse than no source at all,
   * because the reader acts on it at a border.
   */
  citationDomains: [
    'europa.eu',            // ec.europa.eu, home-affairs, eur-lex (the Visa Code)
    'gov.uk',
    'state.gov',            // travel.state.gov
    'usembassy.gov',
    'ustraveldocs.com',
    'canada.ca',
    'gc.ca',
    'vfsglobal.com',
    'blsinternational.com',
    'gov.ae',               // icp.gov.ae
    'u.ae',
    'iata.org',             // Timatic, the database airlines check at the desk
    'icao.int',
    'gouv.fr',
    'diplo.de',
    'auswaertiges-amt.de',
    'esteri.it',
    'exteriores.gob.es',
    'immigration.go.th',
    'imigrasi.go.id',
    'xuatnhapcanh.gov.vn',
  ],

  allowedLinkPrefixes: [
    'https://www.thedummyticket.ae',
    'https://thedummyticket.ae',
  ],

  /**
   * The airline landing pages were deleted on 2026-09-23; linking them would
   * publish a 404. Sister brands are a separate matter: each site in this group
   * names only itself, so a mention is as wrong as a link.
   */
  forbiddenLinkPatterns: [
    {
      pattern: /thedummyticket\.ae\/(emirates|etihad)-dummy-ticket/i,
      message: 'the Emirates and Etihad landing pages were removed — link /dummy-ticket-schengen-visa or the home page instead',
    },
    {
      pattern: /(mydummyticket\.ae|dummyticket365\.com|travl\.ae|visawadi\.com|emirateslimo|airportrides)/i,
      message: 'never link a sister brand — this site speaks only for itself',
    },
  ],

  /** Checked against the article text, not its markup. */
  contentChecks: [
    {
      pattern: /\b(?:USD|\$)\s*\d+[^.]{0,40}\b(?:dummy ticket|flight reservation|onward ticket|flight itinerar)/i,
      message: 'our reservations are priced in dirhams (AED 49 / 69 / 79), never in USD',
    },
    {
      // Fires only where we are the subject offering it. Proximity alone
      // false-positives on checklists, where "visa assistance" is the topic.
      pattern:
        /\b(?:we|The Dummy Ticket AE|thedummyticket\.ae)\s+(?:offer|provide|handle|file|prepare|submit)s?\b[^.]{0,60}\b(?:visa application|visa assistance|your visa)\b/i,
      message: 'we do not file visa applications — we sell the documents that go into one',
    },
    {
      pattern: /\b(?:My Dummy Ticket|Dummy Ticket 365|VisaWadi|Travl|Emirates Limo)\b/,
      message: 'never name a sister brand',
    },
    {
      pattern: /\bguarantee(?:s|d)?\b[^.]{0,40}\b(?:visa|approval|approved|entry)\b/i,
      message: 'never suggest a document guarantees a visa or entry',
    },
  ],

  blogUrl: (slug) => `${SITE}/blog/${slug}`,
  adminBlogUrl: (id) => `${SITE}/admin/blogs/${id}`,

  writerIdentity:
    'You are an expert travel documentation writer for The Dummy Ticket AE, a Dubai-based service issuing verifiable flight reservations and AXA travel insurance. You write SEO-optimised blog posts for UAE residents and expats who need proof of travel for a visa application, an airline check-in, or a border crossing.',

  internalLinkingRule:
    "- Naturally weave in links to The Dummy Ticket AE's own service pages (see Internal Linking Priority in the context)",
  linkFormatRule:
    '- Internal links: use the full URL (https://www.thedummyticket.ae/...) in <a href> attributes. No outbound links except the official sources listed under Sourcing Rules',

  ctaRules: `- Outer element must be <div class="thedt-cta">
- Must contain an <h3> headline and at least one <p> with a clear next-step link
- Use plain HTML only — no inline styles, no <script>, no <style>
- The next step is always booking on the relevant service page. There is a self-serve checkout, so "book now" is the right instruction, not "get in touch" — except for hotel reservations, which are arranged by email.
- Match the article's primary intent:
  * Proof of onward travel, check-in, or a border requirement → https://www.thedummyticket.ae/onward-ticket
  * A Schengen visa file → https://www.thedummyticket.ae/dummy-ticket-schengen-visa
  * A US visa file → https://www.thedummyticket.ae/dummy-ticket-us-visa
  * Itinerary formatting, PNR checks, or booking references → https://www.thedummyticket.ae/flight-itinerary
  * The Schengen insurance requirement → https://www.thedummyticket.ae/schengen-travel-insurance
  * Travel insurance generally → https://www.thedummyticket.ae/travel-insurance
  * No single intent → the home page, https://www.thedummyticket.ae
- Quote the price only where it belongs: reservations from AED 49, insurance from AED 30. Never invent a price for anything else.

Example shape (write your own copy, do not reuse this wording verbatim):

<div class="thedt-cta">
  <h3>Need proof of onward travel before you fly?</h3>
  <p>We hold a real seat under a live PNR, so the airline and the border officer can both look it up. <a href="https://www.thedummyticket.ae/onward-ticket">Book an onward ticket from AED 49</a> and it lands in your inbox within 10 to 15 minutes.</p>
</div>`,

  getRequiredLinks(topic) {
    const title = topic.title;
    const lower = title.toLowerCase();
    const links = [];

    const has = (sub) => lower.includes(sub.toLowerCase());
    const hasWord = (w) => new RegExp(`\\b${w}\\b`, 'i').test(title);

    const onward =
      has('onward') || has('proof of travel') || has('return ticket') ||
      has('check-in') || has('boarding') || has('denied boarding');
    if (onward) {
      links.push({
        url: page('onward-ticket'),
        anchor_hint:
          "varied: e.g. 'an onward ticket', 'proof of onward travel', 'a verified onward reservation'",
        context:
          'Proof of onward travel is the core product here: a genuine reservation under a live PNR, from AED 49, delivered in 10 to 15 minutes. Airlines check it at the desk and immigration checks it at the border.',
        required: true,
      });
    }

    if (has('Schengen') && !has('insurance')) {
      links.push({
        url: page('dummy-ticket-schengen-visa'),
        anchor_hint:
          "varied: e.g. 'a dummy ticket for a Schengen visa', 'a flight reservation for your Schengen file'",
        context:
          'Article 14 of the EU Visa Code asks for evidence of transport arrangements, not a paid ticket. Our reservation answers it, from AED 49, and goes in at VFS Global or BLS International.',
        required: true,
      });
    }

    if (/\bUSA?\b/.test(title) || has('United States') || /\bB[12]\b/.test(title)) {
      links.push({
        url: page('dummy-ticket-us-visa'),
        anchor_hint:
          "varied: e.g. 'a dummy ticket for a US visa', 'a flight reservation for your B1/B2 interview'",
        context:
          'A B1/B2 interview turns on intent. Our reservation puts the travel plan on paper without the applicant buying a long-haul fare before a decision. From AED 49.',
        required: true,
      });
    }

    if (has('PNR') || has('itinerary') || has('booking reference') || has('verify')) {
      links.push({
        url: page('flight-itinerary'),
        anchor_hint:
          "varied: e.g. 'a flight itinerary', 'a reservation with a verifiable PNR'",
        context:
          'The itinerary product: booking reference, route, times and passenger details in standard airline format, under a live PNR that can be verified in Amadeus, Sabre or Travelport. From AED 49.',
        required: true,
      });
    }

    if (has('insurance') || has('medical cover') || has('EUR 30,000') || has('repatriation')) {
      // Repatriation and the EUR 30,000 floor are Schengen requirements even
      // when the title never says Schengen, so they route to the Schengen page.
      const schengenCover = has('Schengen') || has('repatriation') || has('EUR 30,000');
      links.push({
        url: schengenCover ? page('schengen-travel-insurance') : page('travel-insurance'),
        anchor_hint:
          "varied: e.g. 'Schengen travel insurance', 'AXA-issued travel cover', 'travel insurance for your application'",
        context:
          'Genuine AXA cover from AED 30, meeting the EUR 30,000 medical minimum set by Article 15 of the EU Visa Code, valid across all 27 Schengen states and issued within minutes. Unlike a reservation, this is a real policy that pays out.',
        required: true,
      });
    }

    if (!links.length) {
      links.push({
        url: SITE,
        anchor_hint:
          "varied: e.g. 'a verifiable flight reservation', 'The Dummy Ticket AE', 'book a reservation'",
        context:
          'The article has no single service intent, so link the home page, where the reader can book a reservation from AED 49 or add AXA insurance from AED 30.',
        required: true,
      });
    }

    return links;
  },
};

export const BRAND = TARGET;
export default TARGET;
