/**
 * Emirates Limo — chauffeur service and airport transfers in Dubai, Abu Dhabi
 * and Sharjah. One brand, one product family, no partner brands.
 *
 * The sister brands in this monorepo (visas, insurance, dummy tickets, and a
 * second transfer brand) must never appear in an Emirates Limo post, by name or
 * by link. Enforced below rather than left to the prompt.
 */

const SITE = 'https://www.emirateslimo.com';
const pageUrl = (slug) => `${SITE}/${slug}`;

export const TARGET = {
  key: 'emirateslimo',
  name: 'Emirates Limo',
  backendUrl: 'https://api.emirateslimo.com',
  siteUrl: SITE,

  adminEmailEnv: 'EMIRATESLIMO_ADMIN_EMAIL',
  adminPasswordEnv: 'EMIRATESLIMO_ADMIN_PASSWORD',

  ctaClass: 'emirateslimo-cta',

  excludedTags: ['Visa Tips', 'Visa Documents', 'Travel Insurance', 'Dummy Ticket', 'Flight Itinerary'],

  /** First slot for blog-schedule, and posts it must leave where they are. */
  blogSchedule: {
    start: '2026-09-20T05:00:00Z', // 09:00 GST
    excludeSlugs: [],
  },

  /**
   * Format per length tier, matching the other blog targets. `field-report`
   * stays unused until there are first-party booking numbers worth reporting.
   */
  formatsByTier: {
    short: 'quick-answer',
    medium: 'sourced-guide',
    long: 'sourced-guide',
  },

  /**
   * The only domains a post may cite: airports, transport authorities, the
   * toll operator and the two official tourism boards. A transfer claim sourced
   * to a blog or an aggregator is worth nothing.
   */
  citationDomains: [
    // Root domains: isCitationUrl matches subdomains.
    'dubaiairports.ae',           // DXB and DWC terminals, arrivals, parking
    'zayedinternationalairport.ae', // AUH
    'rta.ae',                     // Dubai Roads and Transport Authority
    'itc.gov.ae',                 // Abu Dhabi Integrated Transport Centre
    'salik.ae',                   // Dubai tolls
    'darb.ae',                    // Abu Dhabi tolls
    'dubai.ae',
    'gov.ae',
    'u.ae',                       // the UAE government portal
    'visitdubai.com',             // Dubai Department of Economy and Tourism
    'visitabudhabi.ae',           // Abu Dhabi Department of Culture and Tourism
    'emirates.com',               // terminal and check-in facts only
    'etihad.com',
    'flydubai.com',
  ],

  allowedLinkPrefixes: [SITE, 'https://emirateslimo.com'],

  /**
   * Sister brands are off limits, in either direction. Any of these domains in
   * a post is a hard failure.
   */
  forbiddenLinkPatterns: [
    {
      pattern: /airportrides\.|travl\.ae|visawadi\.|dummyticket365\.|mydummyticket\.|picturesk\./i,
      message: 'Emirates Limo posts must never link a sister brand',
    },
    {
      pattern: /emirateslimo\.com\/book\//i,
      message: 'link a service page, not the booking funnel: /book/* is noindex',
    },
  ],

  /** Checked against the article text, not its markup. */
  contentChecks: [
    {
      pattern: /\b(?:AirportRides|Airport Rides|Travl|VisaWadi|Dummy Ticket 365|My Dummy Ticket|Picturesk)\b/i,
      message: 'Emirates Limo posts must never name a sister brand',
    },
    {
      // Transfer fares are quoted in the booking form only. The one public
      // price is the hourly rate on the fleet cards.
      pattern: /(?:transfer|ride|journey|trip|fare)[^.]{0,60}\bAED\s*\d+(?:\s*(?:per|\/)\s*km)?/i,
      message: 'never quote a transfer fare; the price is fixed in the booking form. Only the hourly rate (from AED 150 per hour) may be quoted',
    },
    {
      pattern: /\b(?:shared shuttle|shared transfer|carpool|ride[- ]?share)\b[^.]{0,60}\bEmirates Limo\b|\bEmirates Limo\b[^.]{0,60}\b(?:shared shuttle|shared transfer|carpool|ride[- ]?share)\b/i,
      message: 'Emirates Limo is private only: never describe it as a shared or pooled service',
    },
    {
      pattern: /\b(?:self[- ]drive|drive it yourself|without a driver|rent a car and drive)\b[^.]{0,60}\bEmirates Limo\b|\bEmirates Limo\b[^.]{0,60}\b(?:self[- ]drive|without a driver)\b/i,
      message: 'Emirates Limo is chauffeur-driven only: there is no self-drive rental',
    },
    {
      pattern: /\b(?:toll|Salik|Darb)s?\b[^.]{0,60}\b(?:extra|added|on top|not included|excluded|passed on to you)\b/i,
      message: 'fares are all-inclusive: tolls and taxes are included, never described as an extra',
    },
    {
      pattern: /\b(?:12|48|72)\s*hours?\b[^.]{0,40}\b(?:cancel|refund)|\b(?:cancel|refund)[^.]{0,40}\b(?:12|48|72)\s*hours?\b/i,
      message: 'the cancellation window is 24 hours: full refund before, no refund after',
    },
  ],

  blogUrl: (slug) => `${SITE}/blog/${slug}`,
  adminBlogUrl: (id) => `${SITE}/admin/blog/${id}/edit`,

  imagePrompt: (title) =>
    `Professional automotive and travel photography, ${title.replace(/[?:!,]/g, '')}, luxury black chauffeur car in Dubai, editorial style, soft natural light, wide shot, no text, no words, no letters, no watermarks, no labels, no number plates`,

  writerIdentity:
    'You are an expert travel content writer for Emirates Limo, a Dubai-based private chauffeur and airport transfer service. You write SEO-optimised blog posts for visitors arriving in the UAE, business travellers, and residents who book chauffeur-driven cars in Dubai and Abu Dhabi.',

  internalLinkingRule:
    "- Naturally weave in links to Emirates Limo's own service pages (see Internal Linking Priority in the context)",
  linkFormatRule:
    '- Internal links: use full URL (https://www.emirateslimo.com/...) in <a href> attributes. Outbound links are limited to the official sources listed under Sourcing Rules. Never link another transport, visa, insurance or ticketing brand.',

  ctaRules: `- Outer element must be <div class="emirateslimo-cta">
- Must contain an <h3> headline and at least one <p> with a clear next-step link
- Use plain HTML only — no inline styles, no <script>, no <style>
- The next step is always the relevant Emirates Limo service page, where the reader gets an instant fixed quote and books online. WhatsApp (+971 56 996 4924) may be offered as the second option.
- Match the article's primary intent:
  * Arriving at or departing from DXB or DWC → https://www.emirateslimo.com/dubai-airport-transfer
  * Airport to a Dubai hotel → https://www.emirateslimo.com/dubai-airport-transfer-to-hotel
  * Arriving at or departing from AUH → https://www.emirateslimo.com/abu-dhabi-airport-transfer
  * Abu Dhabi to DXB or DWC → https://www.emirateslimo.com/abu-dhabi-airport-to-dubai-transfer
  * Travelling between Dubai and Abu Dhabi → the matching direction page
  * A day out, meetings, shopping, events, or "by the hour" → https://www.emirateslimo.com/hourly-chauffeur
  * General chauffeur, business or VIP travel → https://www.emirateslimo.com/chauffeur-service
  * No single service → https://www.emirateslimo.com/services

Example shape (write your own copy, do not reuse this wording verbatim):

<div class="emirateslimo-cta">
  <h3>Landing at Dubai International?</h3>
  <p>Emirates Limo meets you in arrivals with a name board, tracks your flight and includes 60 minutes of free waiting time. Get a fixed price and <a href="https://www.emirateslimo.com/dubai-airport-transfer">book your Dubai airport transfer</a> in a couple of minutes, or message us on WhatsApp at +971 56 996 4924.</p>
</div>`,

  getRequiredLinks(topic) {
    const title = topic.title;
    const lower = title.toLowerCase();
    const links = [];

    const has = (sub) => lower.includes(sub.toLowerCase());
    const hasWord = (w) => new RegExp(`\\b${w}\\b`, 'i').test(title);
    const anyOf = (...subs) => subs.some(has);

    const dubaiAirport = hasWord('DXB') || hasWord('DWC') || has('Dubai International') || has('Al Maktoum') || (has('Dubai airport'));
    const abuDhabiAirport = hasWord('AUH') || has('Zayed International') || has('Abu Dhabi airport');
    const abuDhabiToDubai = has('Abu Dhabi to Dubai');
    const dubaiToAbuDhabi = has('Dubai to Abu Dhabi');
    const hourly = anyOf('hourly', 'by the hour', 'day trip', 'day out', 'shopping', 'meetings', 'events', 'wedding', 'tour');
    const hotel = has('hotel');

    if (abuDhabiAirport && (has('Dubai') && !abuDhabiToDubai)) {
      links.push({
        url: pageUrl('abu-dhabi-airport-to-dubai-transfer'),
        anchor_hint: "varied: e.g. 'Abu Dhabi to Dubai airport transfer', 'a private transfer from Abu Dhabi to DXB'",
        context:
          'Mention that Emirates Limo runs private transfers between Abu Dhabi and Dubai International (DXB) or Al Maktoum (DWC), timed to the flight, with a fixed price confirmed at booking.',
        required: true,
      });
    } else if (abuDhabiAirport) {
      links.push({
        url: pageUrl('abu-dhabi-airport-transfer'),
        anchor_hint: "varied: e.g. 'Abu Dhabi airport transfer', 'a chauffeur pickup at Zayed International', 'private AUH transfer'",
        context:
          'Mention that Emirates Limo meets arrivals at Zayed International Airport (AUH) with a name board, tracks the flight, and includes 60 minutes of free waiting time.',
        required: true,
      });
    }

    if (dubaiAirport && hotel) {
      links.push({
        url: pageUrl('dubai-airport-transfer-to-hotel'),
        anchor_hint: "varied: e.g. 'Dubai airport to hotel transfer', 'a chauffeur from DXB to your hotel'",
        context:
          'Mention that Emirates Limo runs private transfers from DXB or DWC to any hotel in Dubai, with meet and greet in arrivals and 60 minutes of free waiting time.',
        required: true,
      });
    } else if (dubaiAirport) {
      links.push({
        url: pageUrl('dubai-airport-transfer'),
        anchor_hint: "varied: e.g. 'Dubai airport transfer', 'a private chauffeur pickup at DXB', 'Emirates Limo airport transfer'",
        context:
          'Mention that Emirates Limo meets arrivals at Dubai International (DXB) and Al Maktoum (DWC) with a name board, tracks the flight, includes 60 minutes of free waiting time, and fixes the price at booking.',
        required: true,
      });
    }

    if (abuDhabiToDubai && !abuDhabiAirport) {
      links.push({
        url: pageUrl('abu-dhabi-to-dubai-transfer'),
        anchor_hint: "varied: e.g. 'Abu Dhabi to Dubai transfer', 'a private car from Abu Dhabi to Dubai'",
        context:
          'Mention that Emirates Limo runs door-to-door private transfers from Abu Dhabi to Dubai, 24/7, in sedans, SUVs and vans.',
        required: true,
      });
    }
    if (dubaiToAbuDhabi) {
      links.push({
        url: pageUrl('dubai-to-abu-dhabi-transfer'),
        anchor_hint: "varied: e.g. 'Dubai to Abu Dhabi transfer', 'a private car from Dubai to Abu Dhabi'",
        context:
          'Mention that Emirates Limo runs door-to-door private transfers from Dubai to Abu Dhabi, 24/7, in sedans, SUVs and vans.',
        required: true,
      });
    }

    if (hourly) {
      links.push({
        url: pageUrl('hourly-chauffeur'),
        anchor_hint: "varied: e.g. 'hourly chauffeur in Dubai', 'book a chauffeur by the hour', 'Emirates Limo hourly service'",
        context:
          'Mention that Emirates Limo offers an hourly chauffeur service in Dubai from AED 150 per hour, with the driver and vehicle staying with the reader for unlimited stops.',
        required: true,
      });
    }

    if (has('Abu Dhabi') && anyOf('chauffeur', 'driver', 'limo') && !links.length) {
      links.push({
        url: pageUrl('chauffeur-service-abu-dhabi'),
        anchor_hint: "varied: e.g. 'chauffeur service in Abu Dhabi', 'a private driver in Abu Dhabi'",
        context: 'Mention that Emirates Limo provides chauffeur-driven cars across Abu Dhabi, by the hour or for the full day.',
        required: true,
      });
    }

    if (!links.length) {
      links.push({
        url: pageUrl('chauffeur-service'),
        anchor_hint: "varied: e.g. 'chauffeur service in Dubai', 'a private chauffeur from Emirates Limo', 'Emirates Limo'",
        context:
          'The article has no single service, so link the main chauffeur page: private, chauffeur-driven luxury cars across Dubai and the UAE, 24/7, with fixed prices and free cancellation up to 24 hours before pickup.',
        required: true,
      });
    }

    return links;
  },
};

export const BRAND = TARGET;
export default TARGET;
