
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

  blogSchedule: {
    start: '2026-09-10T05:00:00Z', 
    excludeSlugs: [],
  },

  formatsByTier: {
    short: 'quick-answer',
    medium: 'sourced-guide',
    long: 'sourced-guide',
  },

  citationDomains: [
    'gov.uk',
    'state.gov',            
    'usembassy.gov',        
    'ustraveldocs.com',     
    'uscode.house.gov',     
    'govinfo.gov',          
    'canada.ca',            
    'gc.ca',                
    'europa.eu',            
    'vfsglobal.com',
    'vfsglobal.ca',         
    'blsinternational.com',
    'gov.ae',               
    'u.ae',
    'gouv.fr',              
    'diplo.de',             
    'auswaertiges-amt.de',
    'esteri.it',            
    'exteriores.gob.es',
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

  contentChecks: [
    {
      pattern: /(?:dummy ticket|flight reservation|flight itinerar)(?:(?!\bUSD\b)[^.]){0,80}AED\s*\d/i,
      message: 'Dummy Ticket 365 is priced in USD (13 / 20 / 23), never in dirhams',
    },
    {
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
  * Several destinations, or no specific one → CTA leads with https://www.visawadi.com/uae
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
        match: () => /\bUSA?\b/.test(title) || has('United States') || /\bB[12]\b/.test(title),
        label: 'the United States',
      },
      { slug: 'canada', match: () => has('Canada') || hasWord('IRCC'), label: 'Canada' },
      {
        slug: 'saudi-arabia',
        match: () => has('Saudi') || has('Umrah'),
        label: 'Saudi Arabia',
        context:
          'Mention that VisaWadi files the Saudi tourist eVisa for GCC residents at AED 700 all inclusive (government fee and mandatory medical insurance included, refunded in full if refused). No embassy, appointment or biometrics. Link naturally where it adds value.',
      },
    ];

    for (const d of destinations) {
      if (!d.match()) continue;
      links.push({
        url: visaUrl(d.slug),
        anchor_hint: `varied: e.g. '${d.label} visa assistance', 'VisaWadi's ${d.label} visa service', 'help with your ${d.label} application'`,
        context:
          d.context ??
          `Mention that VisaWadi handles ${d.label} visa applications for UAE residents — document review, file preparation, appointment booking and tracking to a decision. Link naturally where it adds value.`,
        required: true,
      });
    }

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
        url: `${SITE}/uae`,
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
