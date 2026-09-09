/**
 * Travl.ae — travel insurance and travel itineraries for UAE residents.
 *
 * Visa assistance moved to VisaWadi in the brand split, so nothing here may
 * describe a visa service as Travl's or link a travl.ae/visa URL: those are all
 * 308 redirects to visawadi.com. Both rules are enforced below rather than left
 * to the prompt.
 */

const SITE = 'https://www.travl.ae';
const VISAWADI = 'https://www.visawadi.com';
const visaUrl = (slug) => `${VISAWADI}/uae/visa/${slug}`;

export const TARGET = {
  key: 'travl',
  name: 'Travl',
  backendUrl: 'https://api.travl.ae',
  siteUrl: SITE,

  /** Env var names, so each brand's admin credentials stay separate. */
  adminEmailEnv: 'TRAVL_ADMIN_EMAIL',
  adminPasswordEnv: 'TRAVL_ADMIN_PASSWORD',


  ctaClass: 'travl-cta',

  excludedTags: ['Visa Tips', 'Visa Documents', 'Dummy Ticket', 'Flight Itinerary'],

  /** First slot for blog-schedule, and posts it must leave where they are. */
  blogSchedule: {
    start: '2026-09-10T05:00:00Z', // 09:00 GST
    excludeSlugs: ['why-you-need-travel-insurance-for-your-schengen-visa-application'],
  },

  /**
   * Format per length tier, matching VisaWadi. `field-report` stays unused
   * until there are first-party claims numbers worth reporting; supply
   * fieldData and flip the long tier to it when there are.
   */
  formatsByTier: {
    short: 'quick-answer',
    medium: 'sourced-guide',
    long: 'sourced-guide',
  },

  /**
   * The only domains a post may cite. Insurance is YMYL: a cover requirement,
   * a compensation right or an entry rule sourced to a blog is worth nothing.
   * Regulators, the bodies that set the rule, and AXA for its own policy terms.
   */
  citationDomains: [
    // Root domains: isCitationUrl matches subdomains, so 'gov.uk' covers 'www.gov.uk'.
    'europa.eu',            // the Schengen insurance minimum, EU261 delay rights
    'gov.uk',               // UK entry rules and FCDO travel advice
    'state.gov',            // travel.state.gov advisories and US entry rules
    'canada.ca',
    'gc.ca',
    'gov.ae',               // mohap.gov.ae, icp.gov.ae
    'u.ae',                 // the UAE government portal
    'centralbank.ae',       // the insurance regulator since the IA merger
    'mofa.gov.ae',
    'who.int',              // vaccination and health requirements
    'icao.int',             // the Montreal Convention, behind baggage liability
    'gov.sa',               // Hajj and Umrah requirements
    'visitsaudi.com',
    // AXA is deliberately absent: axa.ae and axa-gulf.com never answer an
    // automated request, so an invented deep link there would pass the
    // liveness check. Policy terms come from the Travl page instead.
  ],

  allowedLinkPrefixes: [
    SITE,
    'https://travl.ae',
    'https://www.dummyticket365.com',
    'https://dummyticket365.com',
    VISAWADI,
    'https://visawadi.com',
  ],

  /** travl.ae/visa/* is a redirect to VisaWadi, so linking it is a hard failure. */
  forbiddenLinkPatterns: [
    {
      pattern: /travl\.ae\/visa(?:\/|["'])/i,
      message: "travl.ae/visa now redirects to VisaWadi — link https://www.visawadi.com/uae/visa/<slug> instead",
    },
  ],

  /** Checked against the article text, not its markup. */
  contentChecks: [
    {
      pattern: /(?:dummy ticket|flight reservation|flight itinerar)[^.]{0,80}AED\s*\d/i,
      message: 'Dummy Ticket 365 is priced in USD (13 / 20 / 23), never in dirhams. Travl\'s own itinerary at AED 49 is a different product.',
    },
    {
      // Only fires where Travl is the subject of the offer, or the service is
      // said to come "from Travl". Proximity alone false-positives on tables.
      pattern:
        /Travl(?:\.ae)?(?:'s)?\s+(?:offers?|provides?|handles?|sells?|files?)\b[^.]{0,60}\b(?:visa assistance|visa application|visa service)\b|\bvisa (?:assistance|application|service)s?\b[^.]{0,40}\bfrom Travl\b/i,
      message: 'Travl sells travel insurance and itineraries only — attribute visa assistance to VisaWadi',
    },
  ],

  blogUrl: (slug) => `${SITE}/blog/${slug}`,
  adminBlogUrl: (id) => `${SITE}/admin/blogs/${id}`,

  writerIdentity:
    'You are an expert travel content writer for Travl.ae, a UAE-based travel services platform. You write SEO-optimised blog posts targeting UAE residents and expats.',

  /** Sits in the Writing Rules list, near the top. */
  internalLinkingRule:
    "- Naturally weave in links to Travl's own pages (see Internal Linking Priority in the context)",
  /** Sits lower in the same list, next to the HTML rules. */
  linkFormatRule:
    '- Internal links: use full URL (https://www.travl.ae/...) in <a href> attributes. Permitted outbound links: https://www.dummyticket365.com, https://www.visawadi.com/uae/visa/..., and the official sources listed under Sourcing Rules',

  ctaRules: `- Outer element must be <div class="travl-cta">
- Must contain an <h3> headline and at least one <p> with a clear next-step link
- Use plain HTML only — no inline styles, no <script>, no <style>
- Match the article's primary intent:
  * Insurance topics → CTA promotes the most relevant Travl travel insurance page
  * Visa-application topics → CTA leads with the Travl insurance page the visa requires, mentions Dummy Ticket 365 (https://www.dummyticket365.com) for the flight reservation, and points visa assistance itself at the matching VisaWadi page (https://www.visawadi.com/uae/visa/<slug>)
  * Generic travel topics → CTA promotes Travl travel insurance (https://www.travl.ae/travel-insurance)
- Never offer visa assistance as a Travl service, and never tell the reader Travl files or reviews a visa application

Example shape (write your own copy, do not reuse this wording verbatim):

<div class="travl-cta">
  <h3>Need cover before you apply?</h3>
  <p>Travl issues AXA-backed <a href="https://www.travl.ae/travel-insurance/schengen-visa">Schengen-compliant travel insurance</a> from AED 30, with the EUR 30,000 medical cover VFS Global and BLS International ask for, emailed to you in minutes. For proof of onward travel, <a href="https://www.dummyticket365.com">Dummy Ticket 365</a> issues a verified flight reservation with a real PNR from USD 13.</p>
</div>`,

  getRequiredLinks(topic) {
    const title = topic.title;
    const lower = title.toLowerCase();
    const links = [];

    const has = (sub) => lower.includes(sub.toLowerCase());
    const hasWord = (w) => new RegExp(`\\b${w}\\b`, 'i').test(title);

    const dummyKeywords = [
      'visa', 'schengen', 'embassy', 'vfs', 'bls',
      'onward travel', 'dummy ticket', 'flight reservation', 'pnr',
    ];
    if (dummyKeywords.some(has)) {
      links.push({
        url: 'https://www.dummyticket365.com',
        anchor_hint:
          "varied: e.g. 'Dummy Ticket 365', 'verified flight reservation from Dummy Ticket 365', 'a dummy ticket from Dummy Ticket 365'. Never use 'dummyticket365.com' as anchor text — always 'Dummy Ticket 365'.",
        context:
          'Mention that visa applicants typically need proof of onward travel / a flight reservation, and link to Dummy Ticket 365 as a legitimate dummy ticket service starting from USD 13 with valid PNR codes. Where the article topic also involves accommodation (Schengen visa, proof of accommodation, hotel bookings), also mention that Dummy Ticket 365 issues verified hotel reservations by email accepted by embassies as proof of accommodation.',
        required: true,
      });
    }

    /** Visa assistance is VisaWadi's, most specific destination first. */
    const destinations = [
      { slug: 'france-visa', match: () => has('France'), label: 'France' },
      { slug: 'germany-visa', match: () => has('Germany'), label: 'Germany' },
      { slug: 'italy-visa', match: () => has('Italy'), label: 'Italy' },
      { slug: 'spain-visa', match: () => has('Spain'), label: 'Spain' },
      {
        slug: 'united-kingdom',
        match: () => hasWord('UK') || has('United Kingdom') || has('Britain'),
        label: 'the United Kingdom',
      },
      {
        // Case-sensitive on the bare token: /\bUS\b/i also matches the pronoun "us".
        slug: 'usa',
        match: () => /\bUSA?\b/.test(title) || has('United States') || has('B1/B2'),
        label: 'the United States',
      },
      { slug: 'canada', match: () => has('Canada'), label: 'Canada' },
    ];

    const schengenOnly = [
      'Schengen', 'Netherlands', 'Greece', 'Switzerland', 'Austria', 'Portugal', 'Belgium',
    ];
    const visaTopic =
      has('visa') || has('embassy') || has('vfs') || has('bls') || has('consulate');

    if (visaTopic) {
      const matched = destinations.filter((d) => d.match());
      for (const d of matched) {
        links.push({
          url: visaUrl(d.slug),
          anchor_hint: `varied: e.g. '${d.label} visa assistance from VisaWadi', 'VisaWadi's ${d.label} visa service', 'help with your ${d.label} application'`,
          context: `Visa assistance is not a Travl product. Attribute it to VisaWadi, which prepares ${d.label} visa applications for UAE residents — document review, file preparation and appointment booking, from AED 299.`,
          required: true,
        });
      }
      if (!matched.length && schengenOnly.some(has)) {
        links.push({
          url: visaUrl('schengen'),
          anchor_hint:
            "varied: e.g. 'Schengen visa assistance from VisaWadi', 'VisaWadi's Schengen visa service', 'help with your Schengen application'",
          context:
            'Visa assistance is not a Travl product. Attribute it to VisaWadi, which files Schengen applications for UAE residents through VFS Global and BLS International in Dubai and Abu Dhabi, from AED 299.',
          required: true,
        });
      }
    }

    const mentionsSchengen = has('Schengen');
    const mentionsAnnual = has('annual') || has('multi-trip') || has('multi trip');
    const mentionsMedical =
      has('medical') && (has('insurance') || has('cover') || has('evacuation'));
    const mentionsInternational = has('international') && has('insurance');
    const mentionsSingleTrip = has('single trip') || has('single-trip');
    const mentionsInsuranceTopic =
      has('insurance') || has('coverage') || has('policy') || has('claim') || has('cover');

    if (mentionsSchengen && mentionsInsuranceTopic) {
      links.push({
        url: 'https://www.travl.ae/travel-insurance/schengen-visa',
        anchor_hint:
          "varied: e.g. 'Schengen-compliant travel insurance', 'embassy-accepted Schengen insurance from AED 30', 'Travl's Schengen insurance plan'",
        context:
          "Link to Travl's Schengen-compliant travel insurance (EUR 30,000 medical cover, accepted by VFS Global and BLS International, issued by AXA, from AED 30).",
        required: true,
      });
    } else if (mentionsAnnual) {
      links.push({
        url: 'https://www.travl.ae/travel-insurance/annual-multi-trip',
        anchor_hint:
          "varied: e.g. 'annual multi-trip insurance', 'yearly travel cover from AED 245', 'Travl's annual plan'",
        context:
          "Link to Travl's annual multi-trip travel insurance (12-month policy, unlimited trips, from AED 245, ideal for frequent travellers).",
        required: true,
      });
    } else if (mentionsMedical) {
      links.push({
        url: 'https://www.travl.ae/travel-insurance/medical',
        anchor_hint:
          "varied: e.g. 'travel medical insurance', 'medical cover abroad', 'Travl's medical travel plan'",
        context:
          "Link to Travl's travel medical insurance — emergency medical, hospitalisation, repatriation, and COVID-19 cover.",
        required: true,
      });
    } else if (mentionsInternational) {
      links.push({
        url: 'https://www.travl.ae/travel-insurance/international',
        anchor_hint:
          "varied: e.g. 'international travel insurance', 'worldwide cover from AED 70', 'Travl's international plan'",
        context:
          "Link to Travl's international travel insurance (worldwide coverage with EUR 80,000+ medical, trip cancellation, baggage and flight-delay cover, from AED 70).",
        required: true,
      });
    } else if (mentionsSingleTrip) {
      links.push({
        url: 'https://www.travl.ae/travel-insurance/single-trip',
        anchor_hint:
          "varied: e.g. 'single-trip travel insurance', 'one-trip cover for your journey'",
        context:
          "Link to Travl's single-trip travel insurance — coverage for one journey between specific travel dates, Schengen-compliant, issued by AXA.",
        required: true,
      });
    } else if (mentionsInsuranceTopic) {
      links.push({
        url: 'https://www.travl.ae/travel-insurance',
        anchor_hint:
          "varied: e.g. 'Travl travel insurance', 'AXA-issued travel cover', 'travel insurance plans for UAE residents'",
        context:
          'Link to the Travl travel insurance hub — overview of all plans, booking form, and comparison.',
        required: true,
      });
    }

    return links;
  },
};

export const BRAND = TARGET;
export default TARGET;
