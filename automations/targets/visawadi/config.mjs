/**
 * VisaWadi — visa assistance for UAE residents, and nothing else.
 *
 * Two outbound brands are deliberate: Travl for travel insurance, Dummy Ticket
 * 365 for flight reservations. Both are enforced below rather than left to the
 * prompt, because the migrated blog showed exactly how these rules get broken:
 * a product attributed to the wrong brand, or Dummy Ticket 365 priced in
 * dirhams. See apps/visawadi-frontend/CLAUDE.md for the product map.
 */

const SITE = 'https://www.visawadi.com';
const visaUrl = (slug) => `${SITE}/uae/visa/${slug}`;

export const TARGET = {
  key: 'visawadi',
  name: 'VisaWadi',
  backendUrl: 'https://api.visawadi.com',
  siteUrl: SITE,

  adminEmailEnv: 'VISAWADI_ADMIN_EMAIL',
  adminPasswordEnv: 'VISAWADI_ADMIN_PASSWORD',


  ctaClass: 'visawadi-cta',

  excludedTags: ['Flight Itinerary', 'Travel Insurance', 'Visa Tips', 'Europe Travel'],

  /**
   * Format per length tier. `long` maps to sourced-guide rather than
   * field-report because field-report requires first-party numbers and the
   * visa-applications collection is still empty. Flip it to 'field-report'
   * once there is real data to report, and supply fieldData below.
   */
  formatsByTier: {
    short: 'quick-answer',
    medium: 'sourced-guide',
    long: 'sourced-guide',
  },

  /**
   * The only domains a post may cite. Official government and visa-centre
   * sources only: a visa claim sourced to a blog is worth nothing, and on a
   * YMYL topic a wrong claim with a confident link is worse than no link.
   */
  citationDomains: [
    // Root domains: isCitationUrl matches subdomains, so 'gov.uk' covers
    // 'www.gov.uk' and 'usembassy.gov' covers 'ae.usembassy.gov'.
    'gov.uk',
    'state.gov',            // travel.state.gov, ceac.state.gov
    'usembassy.gov',        // ae.usembassy.gov and other posts
    'ustraveldocs.com',     // the US visa appointment system
    'uscode.house.gov',     // the statute itself, e.g. INA 214(b)
    'govinfo.gov',          // Federal Register, CFR
    'canada.ca',            // ircc.canada.ca
    'gc.ca',                // laws-lois.justice.gc.ca, ircc.gc.ca, cic.gc.ca
    'europa.eu',            // ec.europa.eu, home-affairs, eur-lex
    'vfsglobal.com',
    'vfsglobal.ca',         // the Canada visa application centres use the .ca domain
    'blsinternational.com',
    'gov.ae',               // icp.gov.ae
    'u.ae',
    'gouv.fr',              // france-visas.gouv.fr, diplomatie.gouv.fr
    'diplo.de',             // videx.diplo.de
    'auswaertiges-amt.de',
    'esteri.it',            // vistoperitalia.esteri.it
    'exteriores.gob.es',
    // Saudi Arabia. 'gov.sa' covers my.gov.sa and mofa.gov.sa; the tourist
    // eVisa itself is issued on visitsaudi.com, which is not a .gov.sa domain.
    'gov.sa',
    'visitsaudi.com',
  ],


  allowedLinkPrefixes: [
    'https://www.visawadi.com',
    'https://visawadi.com',
    'https://www.dummyticket365.com',
    'https://dummyticket365.com',
    'https://www.travl.ae',
    'https://travl.ae',
  ],

  /**
   * Travl's itinerary may be named but never linked, and the legacy uncountried
   * visa path only survives as a redirect. Both are hard failures.
   */
  forbiddenLinkPatterns: [
    {
      pattern: /travl\.ae\/travel-itinerary/i,
      message: "the travel itinerary must never be linked — mention Travl by name instead",
    },
    {
      pattern: /visawadi\.com\/visa\//i,
      message: "use the country-prefixed /uae/visa/<slug> URL, not the legacy /visa/<slug> redirect",
    },
  ],

  /** Checked against the article text, not its markup. */
  contentChecks: [
    {
      pattern: /(?:dummy ticket|flight reservation|flight itinerar)[^.]{0,80}AED\s*\d/i,
      message: 'Dummy Ticket 365 is priced in USD (13 / 20 / 23), never in dirhams',
    },
    {
      // Only fires when VisaWadi is the subject of the offer, or the product is
      // said to come "from VisaWadi". Proximity alone false-positives on tables,
      // where unrelated cells flatten into one run of text.
      pattern:
        /VisaWadi(?:\.ae)?(?:'s)?\s+(?:offers?|provides?|sells?|issues?|has)\b[^.]{0,60}\b(?:insurance|itinerar|dummy ticket)\b|\b(?:insurance|itinerar\w*|dummy tickets?)\b[^.]{0,40}\bfrom VisaWadi\b/i,
      message: 'VisaWadi sells visa assistance only — attribute insurance to Travl and tickets to Dummy Ticket 365',
    },
  ],

  blogUrl: (slug) => `${SITE}/blog/${slug}`,
  adminBlogUrl: (id) => `${SITE}/admin/blogs/${id}`,

  writerIdentity:
    'You are an expert visa content writer for VisaWadi, a UAE-based visa assistance service. You write SEO-optimised blog posts targeting UAE residents and expats applying for visitor visas.',

  internalLinkingRule:
    "- Naturally weave in links to VisaWadi's own visa pages (see Internal Linking Priority in the context)",
  linkFormatRule:
    '- Internal links: use full URL (https://www.visawadi.com/uae/visa/... ) in <a href> attributes. Permitted outbound links: https://www.dummyticket365.com, https://www.travl.ae/travel-insurance, and the official sources listed under Sourcing Rules',

  ctaRules: `- Outer element must be <div class="visawadi-cta">
- Must contain an <h3> headline and at least one <p> with a clear next-step link
- Use plain HTML only — no inline styles, no <script>, no <style>
- The next step is always a free consultation on the relevant VisaWadi visa page. Never tell the reader to sign up, create an account, or book online: there is no self-serve checkout.
- Match the article's primary intent:
  * A specific destination → CTA leads with that destination's VisaWadi visa page (https://www.visawadi.com/uae/visa/<slug>)
  * Several destinations, or no specific one → CTA leads with https://www.visawadi.com/uae/visa
  * Where the topic involves proof of onward travel, also mention Dummy Ticket 365 (https://www.dummyticket365.com) for the flight reservation, priced from USD 13
  * Where the topic involves the insurance requirement, also mention Travl (https://www.travl.ae/travel-insurance) for AXA-issued cover from AED 30

Example shape (write your own copy, do not reuse this wording verbatim):

<div class="visawadi-cta">
  <h3>Applying for a Schengen visa from the UAE?</h3>
  <p>VisaWadi prepares the whole file, checks every document against embassy requirements and books your appointment. Get a <a href="https://www.visawadi.com/uae/visa/schengen">free consultation on your Schengen application</a>, with packages from AED 299. Need proof of onward travel? <a href="https://www.dummyticket365.com">Dummy Ticket 365</a> issues a verified flight reservation with a real PNR from USD 13.</p>
</div>`,

  getRequiredLinks(topic) {
    const title = topic.title;
    const lower = title.toLowerCase();
    const links = [];

    const has = (sub) => lower.includes(sub.toLowerCase());
    const hasWord = (w) => new RegExp(`\\b${w}\\b`, 'i').test(title);

    /** Destination pages, most specific first so a "France visa" post links France, not just Schengen. */
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
        slug: 'usa',
        // Case-sensitive on the bare token: /\bUS\b/i also matches the pronoun "us".
        match: () => /\bUSA?\b/.test(title) || has('United States') || has('B1/B2'),
        label: 'the United States',
      },
      { slug: 'canada', match: () => has('Canada'), label: 'Canada' },
    ];

    for (const d of destinations) {
      if (!d.match()) continue;
      links.push({
        url: visaUrl(d.slug),
        anchor_hint: `varied: e.g. '${d.label} visa assistance', 'VisaWadi's ${d.label} visa service', 'help with your ${d.label} application'`,
        context: `Mention that VisaWadi handles ${d.label} visa applications for UAE residents — document review, file preparation, appointment booking and tracking to a decision. Link naturally where it adds value.`,
        required: true,
      });
    }

    // Schengen covers the bloc. Add it when the article is about Schengen itself,
    // or about a Schengen country we do not have a dedicated page for.
    const schengenOnly = ['Netherlands', 'Greece', 'Switzerland', 'Austria', 'Portugal', 'Belgium'];
    if (has('Schengen') || schengenOnly.some(has)) {
      links.push({
        url: visaUrl('schengen'),
        anchor_hint:
          "varied: e.g. 'Schengen visa assistance', 'VisaWadi's Schengen visa service', 'help with your Schengen application'",
        context:
          'Mention that VisaWadi handles Schengen visa applications for UAE residents, filed through VFS Global or BLS International in Dubai and Abu Dhabi, with packages from AED 299.',
        required: true,
      });
    }

    if (!links.length) {
      links.push({
        url: `${SITE}/uae/visa`,
        anchor_hint:
          "varied: e.g. 'visa assistance for UAE residents', 'the destinations VisaWadi covers', 'VisaWadi's visa services'",
        context:
          'The article has no single destination, so link the visa hub listing every destination VisaWadi handles.',
        required: true,
      });
    }

    const onwardTravel = [
      'onward travel', 'dummy ticket', 'flight reservation', 'flight itinerary',
      'pnr', 'proof of travel', 'return ticket', 'flight ticket', 'onward ticket',
    ];
    if (onwardTravel.some(has)) {
      links.push({
        url: 'https://www.dummyticket365.com',
        anchor_hint:
          "varied: e.g. 'Dummy Ticket 365', 'a verified flight reservation from Dummy Ticket 365'. Never use 'dummyticket365.com' as anchor text — always 'Dummy Ticket 365'.",
        context:
          'Visa applicants need proof of onward travel. Link to Dummy Ticket 365 as a legitimate flight reservation service with a valid PNR code, from USD 13 for 2 days validity (USD 20 for 7 days, USD 23 for 14 days), delivered by email in minutes. Never quote a dirham price for it.',
        required: true,
      });
    }

    const insurance = has('insurance') || has('medical cover') || has('EUR 30,000');
    if (insurance) {
      links.push({
        url: has('Schengen')
          ? 'https://www.travl.ae/travel-insurance/schengen-visa'
          : 'https://www.travl.ae/travel-insurance',
        anchor_hint:
          "varied: e.g. 'Schengen-compliant travel insurance from Travl', 'AXA-issued travel cover', 'travel insurance for your application'",
        context:
          'Travel insurance is a visa requirement, not a VisaWadi product. Attribute it to Travl: AXA-issued, from AED 30, meeting the EUR 30,000 minimum medical cover and accepted by VFS Global and BLS International. Never describe it as a VisaWadi product.',
        required: true,
      });
    }

    return links;
  },
};

export const BRAND = TARGET;
export default TARGET;
