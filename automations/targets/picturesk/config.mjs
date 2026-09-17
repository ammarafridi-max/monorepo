/**
 * Picturesk — an AI headshot generator, and nothing else.
 *
 * The rules below are enforced rather than left to the prompt, for the same
 * reason they are on the other targets: a wrong price, an invented subscription,
 * or a mention of another brand in this company's portfolio would each undo the
 * page it lands on. Picturesk is the one brand here that must never name the
 * others, so that is a hard content check, not a suggestion.
 */

const SITE = 'https://www.picturesk.ai';
const page = (path) => `${SITE}${path}`;

export const TARGET = {
  key: 'picturesk',
  name: 'Picturesk',
  // Overridable so a hand-written batch can be posted through a local api with a
  // real staff session (which sets the author) rather than the break-glass token.
  backendUrl: process.env.PICTURESK_BACKEND_URL || 'https://api.picturesk.ai',
  siteUrl: SITE,

  adminEmailEnv: 'PICTURESK_ADMIN_EMAIL',
  adminPasswordEnv: 'PICTURESK_ADMIN_PASSWORD',

  ctaClass: 'picturesk-cta',

  /** No tags exist yet; the job creates the ones in topics.json as it publishes. */
  excludedTags: [],

  /** First slot for blog-schedule, and posts it must leave where they are. */
  blogSchedule: {
    start: '2026-09-15T05:00:00Z',
    excludeSlugs: [],
  },

  /**
   * Format per length tier. `long` maps to sourced-guide rather than
   * field-report because field-report requires first-party numbers, and there is
   * no aggregate order data to report yet. Flip it once there is.
   */
  formatsByTier: {
    short: 'quick-answer',
    medium: 'sourced-guide',
    long: 'sourced-guide',
  },

  /**
   * The only domains a post may cite. Headshots are not a regulated topic, so
   * "official" here means the platforms and institutions whose guidance actually
   * governs the outcome: LinkedIn's own help and business pages for anything
   * about profile photos, the realtor and HR bodies for their professions, and
   * peer-reviewed or institutional research on first impressions. No blogs, no
   * competitors, no photography retailers.
   */
  citationDomains: [
    'linkedin.com',            // help centre, business.linkedin.com, engineering blog
    'nar.realtor',             // National Association of Realtors
    'shrm.org',                // Society for Human Resource Management
    'hbr.org',                 // Harvard Business Review
    'apa.org',                 // American Psychological Association
    'psychologicalscience.org',
    'pnas.org',
    'princeton.edu',           // Todorov lab, first-impression research
    'nature.com',
    'sciencedirect.com',
    'pewresearch.org',
    'bls.gov',                 // occupational data
    'ons.gov.uk',
    'ico.org.uk',              // biometric and image data guidance
    'gdpr.eu',
  ],

  /** Picturesk links only to Picturesk. */
  allowedLinkPrefixes: [
    'https://www.picturesk.ai',
    'https://picturesk.ai',
  ],

  forbiddenLinkPatterns: [
    {
      pattern: /picturesk\.ai\/?(?:["'\s>]|$)/i,
      message: 'link the product page https://www.picturesk.ai/ai-headshot-generator, never the bare root, which only redirects',
    },
    {
      pattern: /picturesk\.ai\/generator\//i,
      message: 'the /generator/* paths are legacy redirects; the funnel lives under /ai-headshot-generator/',
    },
    {
      pattern: /picturesk\.ai\/(?:success|cancel|account|login|signup|admin)/i,
      message: 'never link a noindex page from an article',
    },
  ],

  /** Checked against the article text, not its markup. */
  contentChecks: [
    {
      // Brand neutrality is strict: Picturesk names only itself.
      pattern: /\b(?:Travl|Dummy ?Ticket ?365|DT365|MDT|My ?Dummy ?Ticket|VisaWadi|Emirates ?Limo|AirportRides|Airport ?Rides)\b/i,
      message: 'Picturesk must never mention another brand in this portfolio',
    },
    {
      pattern: /\b(?:subscription|monthly plan|credits?\b(?! card)|top[- ]up)\b[^.]{0,80}\bPicturesk\b|\bPicturesk\b[^.]{0,80}\b(?:subscription|monthly plan|credit balance|top[- ]up)\b/i,
      message: 'Picturesk is a one-time payment: no subscription, no credits, no monthly plan',
    },
    {
      // Any dollar figure attributed to Picturesk must be one of the three prices.
      pattern: /\bPicturesk\b[^.]{0,80}\$(?!9\b|29\b|49\b)\d+|\$(?!9\b|29\b|49\b)\d+[^.]{0,60}\b(?:from|with|at) Picturesk\b/i,
      message: 'Picturesk prices are $9, $29 and $49 only',
    },
    {
      pattern: /\b(?:automatically|auto)[- ]?delet\w*[^.]{0,60}\b(?:photos?|selfies?|images?)\b|\b(?:photos?|selfies?|images?)\b[^.]{0,60}\bdeleted automatically\b/i,
      message: 'photos are deleted on request, never automatically; do not claim auto-deletion',
    },
    {
      pattern: /\bface[- ]swap\w*\b[^.]{0,60}\bPicturesk\b|\bPicturesk\b[^.]{0,60}\bface[- ]swap/i,
      message: 'Picturesk fine-tunes a model on the customer\'s face; it is not a face swap',
    },
  ],

  /**
   * Cover image prompt. The shared default asks for travel photography, which is
   * wrong here. Covers are editorial scenes around the act of getting a photo
   * (a phone by a window, a studio, a desk), never a finished headshot: a cover
   * that looked like a customer result would read as a claim about our output.
   */
  imagePrompt(title) {
    const t = title.toLowerCase();
    const scene =
      // 'old' before the generic 'photos' branch, or it never matches.
      t.includes('old') ? 'a box of printed photographs and a modern phone on a table, warm afternoon light'
      : t.includes('background') ? 'a photographer adjusting a plain grey studio backdrop beside a large window, camera on a tripod'
      : t.includes('wear') ? 'a rail of smart work outfits, shirts, blazers and knitwear, in a bright dressing area near a window'
      : t.includes('crop') ? 'a hand holding a phone at eye level in front of a window, the screen showing a camera app, shallow depth of field'
      : t.includes('smile') ? 'a person laughing naturally at something off camera in soft window light, head and shoulders, candid'
      : t.includes('update') || t.includes('often') ? 'a desk with a laptop, a phone propped against a mug and morning light, someone about to take a photo'
      : t.includes('how many') || t.includes('photos') ? 'a grid of phone photos spread on a wooden table beside a coffee, seen from above'
      : t.includes('selfies') ? 'a person taking a selfie in front of a bright window at home, phone held at arm\'s length, natural light'
      : t.includes('nothing like') ? 'a phone leaning on a stack of books by a window, its screen showing a blurred portrait, soft light'
      : 'a person taking a selfie by a window in a bright modern office, phone at eye level';
    return `Editorial lifestyle photograph, ${scene}, soft natural window light, muted warm palette with deep green accents, shallow depth of field, 35mm, no text, no words, no letters, no logos, no watermarks, no labels`;
  },

  blogUrl: (slug) => `${SITE}/blog/${slug}`,
  adminBlogUrl: (id) => `${SITE}/admin/blog/${id}/edit`,

  writerIdentity:
    'You are an expert content writer for Picturesk, an AI headshot generator that turns a customer\'s own selfies into professional headshots. You write SEO-optimised blog posts for professionals deciding how to get a headshot: people updating LinkedIn, job applicants, consultants, real estate agents, founders and teams.',

  internalLinkingRule:
    "- Naturally weave in links to Picturesk's own pages (see Internal Linking Priority in the context). Every article links the product at least once with descriptive anchor text.",
  linkFormatRule:
    '- Internal links: use full URLs (https://www.picturesk.ai/...) in <a href> attributes. Outbound links are permitted ONLY to the sources listed under Sourcing Rules. Never link another brand or a competitor.',

  ctaRules: `- Outer element must be <div class="picturesk-cta">
- Must contain an <h3> headline and at least one <p> with a clear next-step link
- Use plain HTML only — no inline styles, no <script>, no <style>
- The next step is always to start a set: link the landing page that matches the article, and say the price is from $9, one-time, no subscription.
- Match the article's primary intent:
  * LinkedIn or profile photos → lead with https://www.picturesk.ai/linkedin-headshots
  * Real estate, realtors, listings → lead with https://www.picturesk.ai/real-estate-agent-headshots
  * Cost, pricing, plans → lead with https://www.picturesk.ai/pricing
  * Comparison with a photographer → lead with https://www.picturesk.ai/ai-headshots-vs-photographer
  * Anything else → lead with https://www.picturesk.ai/ai-headshot-generator
- Never promise a feature that does not exist (team plans, retouching, subscriptions, auto-deletion).

Example shape (write your own copy, do not reuse this wording verbatim):

<div class="picturesk-cta">
  <h3>Need a headshot this week?</h3>
  <p>Upload five to fifteen selfies, pick your backgrounds and outfits, and Picturesk trains a model on your face and emails a full set in about an hour. <a href="https://www.picturesk.ai/linkedin-headshots">Get your LinkedIn headshots</a> from $9, one payment, no subscription. If they do not look like you, you get a full refund.</p>
</div>`,

  /**
   * Which Picturesk pages an article MUST link, inferred from its title. Most
   * specific first, so a "LinkedIn headshot cost" post links the LinkedIn page
   * and the pricing page rather than only the generic product page.
   */
  getRequiredLinks(topic) {
    const title = topic.title;
    const lower = title.toLowerCase();
    const has = (sub) => lower.includes(sub.toLowerCase());
    const links = [];

    if (has('linkedin') || has('profile photo') || has('profile picture')) {
      links.push({
        url: page('/linkedin-headshots'),
        anchor_hint: "varied: e.g. 'LinkedIn headshots', 'a LinkedIn headshot from your own selfies', 'Picturesk's LinkedIn headshots'",
        context: 'Mention that Picturesk turns five to fifteen selfies into a set of LinkedIn-ready headshots, square 1:1 so the circular crop never clips the head, delivered by email in about an hour from $9. Link naturally where it adds value.',
        required: true,
      });
    }

    if (has('real estate') || has('realtor') || has('estate agent') || has('brokerage') || has('listing')) {
      links.push({
        url: page('/real-estate-agent-headshots'),
        anchor_hint: "varied: e.g. 'real estate agent headshots', 'a headshot for your listings', 'Picturesk for agents'",
        context: 'Mention that Picturesk gives agents a full-resolution set for listings, signage, mailers and the brokerage page, from their own selfies, in about an hour from $9. Link naturally where it adds value.',
        required: true,
      });
    }

    if (has('cost') || has('price') || has('pricing') || has('how much') || has('cheap') || has('worth')) {
      links.push({
        url: page('/pricing'),
        anchor_hint: "varied: e.g. 'Picturesk pricing', 'three one-time plans from $9', 'what a set costs'",
        context: 'Picturesk has three one-time plans: Starter $9 for 5 headshots, Pro $29 for 25, Premium $49 for 60. No subscription, no credits, full resolution on every plan. Never quote any other figure.',
        required: true,
      });
    }

    if (has('photographer') || has('photo studio') || has('professional photo') || has('vs')) {
      links.push({
        url: page('/ai-headshots-vs-photographer'),
        anchor_hint: "varied: e.g. 'AI headshots versus a photographer', 'how the two compare', 'the honest comparison'",
        context: 'Picturesk has a comparison page covering cost, time, consistency and where a photographer still wins. Link it where the article weighs the two options.',
        required: true,
      });
    }

    // Every article links the product itself, so the piece is never a dead end.
    links.push({
      url: page('/ai-headshot-generator'),
      anchor_hint: "varied: e.g. 'AI headshot generator', 'a set of AI headshots from your selfies', 'Picturesk'",
      context: 'Picturesk trains a model on the customer\'s own face from five to fifteen selfies, screens every photo before payment, and emails a full-resolution set in about an hour. One payment from $9, automatic refund if a run fails, full refund within 3 days if the results do not look like them.',
      required: true,
    });

    return links;
  },
};

export const BRAND = TARGET;
export default TARGET;
