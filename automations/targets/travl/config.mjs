/**
 * Travl.ae — travel insurance and travel itineraries for UAE residents.
 *
 * This file is the whole of what used to be hardcoded in blog-utils.mjs and the
 * two generator scripts. Behaviour is byte-for-byte what Travl was generating
 * before the brand split, so a run with `--brand travl` produces the same post
 * it always did.
 */

export const TARGET = {
  key: 'travl',
  name: 'Travl',
  backendUrl: 'https://api.travl.ae',
  siteUrl: 'https://www.travl.ae',

  /** Env var names, so each brand's admin credentials stay separate. */
  adminEmailEnv: 'TRAVL_ADMIN_EMAIL',
  adminPasswordEnv: 'TRAVL_ADMIN_PASSWORD',


  ctaClass: 'travl-cta',

  allowedLinkPrefixes: [
    'https://www.travl.ae',
    'https://travl.ae',
    'https://www.dummyticket365.com',
    'https://dummyticket365.com',
  ],

  blogUrl: (slug) => `https://www.travl.ae/blog/${slug}`,
  adminBlogUrl: (id) => `https://www.travl.ae/admin/blogs/${id}`,

  writerIdentity:
    'You are an expert travel content writer for Travl.ae, a UAE-based travel services platform. You write SEO-optimised blog posts targeting UAE residents and expats.',

  /** Sits in the Writing Rules list, near the top. */
  internalLinkingRule:
    "- Naturally weave in links to Travl's own pages (see Internal Linking Priority in the context)",
  /** Sits lower in the same list, next to the HTML rules. */
  linkFormatRule:
    '- Internal links: use full URL (https://www.travl.ae/... or https://www.dummyticket365.com) in <a href> attributes',

  ctaRules: `- Outer element must be <div class="travl-cta">
- Must contain an <h3> headline and at least one <p> with a clear next-step link
- Use plain HTML only — no inline styles, no <script>, no <style>
- Match the article's primary intent:
  * Visa-application topics → CTA leads with Dummy Ticket 365 (https://www.dummyticket365.com) for the required flight reservation, mentions the hotel reservation service if accommodation is relevant to the topic, and briefly mentions the matching Travl visa assistance page (Schengen / UK / USA / Canada)
  * Insurance topics → CTA promotes the most relevant Travl travel insurance page
  * Generic travel topics → CTA promotes Travl travel insurance (https://www.travl.ae/travel-insurance)

Example shape (write your own copy, do not reuse this wording verbatim):

<div class="travl-cta">
  <h3>Need a flight reservation for your visa?</h3>
  <p>Get an embassy-accepted reservation from <a href="https://www.dummyticket365.com">Dummy Ticket 365</a> starting at USD 13, delivered to your inbox in minutes. Dummy Ticket 365 also issues verified hotel reservations if you need proof of accommodation. Travl also offers full <a href="https://www.travl.ae/visa/schengen">Schengen visa assistance</a> for end-to-end support.</p>
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

    const schengenCountries = [
      'Schengen', 'France', 'Germany', 'Italy', 'Spain',
      'Netherlands', 'Greece', 'Switzerland',
    ];
    if (schengenCountries.some(has)) {
      links.push({
        url: 'https://www.travl.ae/visa/schengen',
        anchor_hint:
          "varied: e.g. 'Schengen visa assistance', 'Travl's Schengen visa service', 'help with your Schengen application'",
        context:
          'Mention that Travl offers visa assistance for this destination — handling documentation, appointment booking, and application review for UAE residents. Link naturally where it adds value.',
        required: true,
      });
    }

    if (hasWord('UK') || has('United Kingdom') || has('Britain')) {
      links.push({
        url: 'https://www.travl.ae/visa/united-kingdom',
        anchor_hint:
          "varied: e.g. 'UK visa assistance', 'Travl's UK visa service', 'help with your UK Standard Visitor Visa'",
        context:
          'Mention that Travl offers UK visa assistance — handling documentation, appointment booking, and application review for UAE residents. Link naturally where it adds value.',
        required: true,
      });
    }

    if (hasWord('USA') || has('United States') || has('B1/B2')) {
      links.push({
        url: 'https://www.travl.ae/visa/usa',
        anchor_hint:
          "varied: e.g. 'USA visa assistance', 'Travl's US visa service', 'help with your B1/B2 application'",
        context:
          'Mention that Travl offers USA visa assistance — handling documentation, DS-160 form review, and Dubai embassy appointment booking for UAE residents. Link naturally where it adds value.',
        required: true,
      });
    }

    if (has('Canada')) {
      links.push({
        url: 'https://www.travl.ae/visa/canada',
        anchor_hint:
          "varied: e.g. 'Canada visa assistance', 'Travl's Canada visa service', 'help with your Canadian visitor visa'",
        context:
          'Mention that Travl offers Canada visa assistance — handling documentation, biometrics scheduling, and application review for UAE residents. Link naturally where it adds value.',
        required: true,
      });
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
