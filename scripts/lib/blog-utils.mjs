/**
 * blog-utils.mjs
 *
 * Shared helpers for the Travl blog automation scripts:
 *   - generate-blog-draft.mjs (daily cron)
 *   - expand-blog-post.mjs    (on-demand expansion)
 *
 * Anything used by both scripts lives here so the prompt rules, link logic,
 * validation, and API wrappers stay in lockstep.
 */

// ── Config ────────────────────────────────────────────────────────────────────

export const BACKEND_URL = "https://api.travl.ae";

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// ── Length tiers ──────────────────────────────────────────────────────────────

// Word-count and max_tokens budget per length tier.
export const LENGTH_TIERS = {
  short: { wordRange: "700–1000 words", maxTokens: 4000 },
  medium: { wordRange: "1200–1800 words", maxTokens: 6000 },
  long: { wordRange: "2500–3500 words", maxTokens: 8000 },
};

// Minimum acceptable word count per tier — looser than the prompt's wordRange
// so the model gets some slack before we hard-fail the run.
export const MIN_WORD_COUNT = {
  short: 600,
  medium: 1000,
  long: 2000,
};

// Allowed URL prefixes for <a href> attributes in generated content. Anything
// outside this list (and relative paths starting with "/") is treated as a
// forbidden external link.
export const ALLOWED_LINK_PREFIXES = [
  "https://www.travl.ae",
  "https://travl.ae",
  "https://www.dummyticket365.com",
  "https://dummyticket365.com",
];

// Words the prompt asks the model to avoid. Matches trigger a soft warning
// only — they're style preferences, not deal-breakers.
export const BANNED_WORDS = [
  "utilize",
  "utilise",
  "delve",
  "leverage",
  "furthermore",
  "navigate",
  "crucial",
  "seamlessly",
  "robust",
  "streamline",
  "unlock",
];

// ── API helpers ───────────────────────────────────────────────────────────────

/** Fetches with error handling. Returns parsed JSON or throws. */
export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `API ${options.method || "GET"} ${path} → ${res.status}: ${JSON.stringify(body)}`,
    );
  }
  return body;
}

/**
 * Like apiFetch but also returns the raw response (so callers can read headers).
 */
export async function apiFetchRaw(path, options = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `API ${options.method || "GET"} ${path} → ${res.status}: ${JSON.stringify(body)}`,
    );
  }
  return { res, body };
}

/** Extracts the `jwt=...` value from one or more Set-Cookie headers. */
export function extractJwtCookie(res) {
  let cookies = [];
  if (typeof res.headers.getSetCookie === "function") {
    cookies = res.headers.getSetCookie();
  } else {
    const raw = res.headers.get("set-cookie");
    if (raw) cookies = [raw];
  }
  for (const c of cookies) {
    const match = c.match(/(?:^|;\s*)jwt=([^;]+)/);
    if (match && match[1] && match[1] !== "loggedout") return match[1];
  }
  return null;
}

/** Logs in with TRAVL_ADMIN_EMAIL / TRAVL_ADMIN_PASSWORD and returns a JWT. */
export async function login() {
  const ADMIN_EMAIL = process.env.TRAVL_ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.TRAVL_ADMIN_PASSWORD;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      "TRAVL_ADMIN_EMAIL and TRAVL_ADMIN_PASSWORD env vars are required.",
    );
  }
  const { res, body } = await apiFetchRaw("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const token =
    extractJwtCookie(res) || body?.data?.token || body?.token || null;
  if (!token) {
    throw new Error(
      `Login succeeded but no token returned: ${JSON.stringify(body)}`,
    );
  }
  console.log("✓ Logged in");
  return token;
}

/** Returns the list of tag names available in the admin panel. */
export async function fetchBlogTags(token) {
  const data = await apiFetch("/api/blog-tags", {
    headers: { Cookie: `jwt=${token}` },
  });
  const tags = data?.data ?? [];
  return tags.map((t) => t.name);
}

// ── Required internal links ──────────────────────────────────────────────────

/**
 * Returns the set of internal links Claude MUST include in the body, based on
 * keywords in the topic title. Each entry is { url, anchor_hint, context,
 * required: true } so the prompt can render a clear, structured block.
 */
export function getRequiredLinks(topic) {
  const title = topic.title;
  const lower = title.toLowerCase();
  const links = [];

  const has = (sub) => lower.includes(sub.toLowerCase());
  const hasWord = (w) => new RegExp(`\\b${w}\\b`, "i").test(title);

  // 1. Dummy Ticket 365: any visa / embassy / proof-of-onward-travel topic.
  const dummyKeywords = [
    "visa",
    "schengen",
    "embassy",
    "vfs",
    "bls",
    "onward travel",
    "dummy ticket",
    "flight reservation",
    "pnr",
  ];
  if (dummyKeywords.some(has)) {
    links.push({
      url: "https://www.dummyticket365.com",
      anchor_hint:
        "varied: e.g. 'Dummy Ticket 365', 'verified flight reservation from Dummy Ticket 365', 'a dummy ticket from Dummy Ticket 365'. Never use 'dummyticket365.com' as anchor text — always 'Dummy Ticket 365'.",
      context:
        "Mention that visa applicants typically need proof of onward travel / a flight reservation, and link to Dummy Ticket 365 as a legitimate dummy ticket service starting from USD 13 with valid PNR codes. Where the article topic also involves accommodation (Schengen visa, proof of accommodation, hotel bookings), also mention that Dummy Ticket 365 issues verified hotel reservations by email accepted by embassies as proof of accommodation.",
      required: true,
    });
  }

  // 2. Visa assistance — Schengen.
  const schengenCountries = [
    "Schengen",
    "France",
    "Germany",
    "Italy",
    "Spain",
    "Netherlands",
    "Greece",
    "Switzerland",
  ];
  if (schengenCountries.some(has)) {
    links.push({
      url: "https://www.travl.ae/visa/schengen",
      anchor_hint:
        "varied: e.g. 'Schengen visa assistance', 'Travl's Schengen visa service', 'help with your Schengen application'",
      context:
        "Mention that Travl offers visa assistance for this destination — handling documentation, appointment booking, and application review for UAE residents. Link naturally where it adds value.",
      required: true,
    });
  }

  // 3. Visa assistance — UK.
  if (hasWord("UK") || has("United Kingdom") || has("Britain")) {
    links.push({
      url: "https://www.travl.ae/visa/united-kingdom",
      anchor_hint:
        "varied: e.g. 'UK visa assistance', 'Travl's UK visa service', 'help with your UK Standard Visitor Visa'",
      context:
        "Mention that Travl offers UK visa assistance — handling documentation, appointment booking, and application review for UAE residents. Link naturally where it adds value.",
      required: true,
    });
  }

  // 4. Visa assistance — USA. Strict matches only: "USA" (whole word),
  // "United States", or "B1/B2". Bare "US" is excluded to avoid false
  // positives on incidental two-letter occurrences.
  if (hasWord("USA") || has("United States") || has("B1/B2")) {
    links.push({
      url: "https://www.travl.ae/visa/usa",
      anchor_hint:
        "varied: e.g. 'USA visa assistance', 'Travl's US visa service', 'help with your B1/B2 application'",
      context:
        "Mention that Travl offers USA visa assistance — handling documentation, DS-160 form review, and Dubai embassy appointment booking for UAE residents. Link naturally where it adds value.",
      required: true,
    });
  }

  // 5. Visa assistance — Canada.
  if (has("Canada")) {
    links.push({
      url: "https://www.travl.ae/visa/canada",
      anchor_hint:
        "varied: e.g. 'Canada visa assistance', 'Travl's Canada visa service', 'help with your Canadian visitor visa'",
      context:
        "Mention that Travl offers Canada visa assistance — handling documentation, biometrics scheduling, and application review for UAE residents. Link naturally where it adds value.",
      required: true,
    });
  }

  // 6. Travel insurance — pick the most specific match available.
  const mentionsSchengen = has("Schengen");
  const mentionsAnnual = has("annual") || has("multi-trip") || has("multi trip");
  const mentionsMedical =
    has("medical") && (has("insurance") || has("cover") || has("evacuation"));
  const mentionsInternational = has("international") && has("insurance");
  const mentionsSingleTrip = has("single trip") || has("single-trip");
  const mentionsInsuranceTopic =
    has("insurance") ||
    has("coverage") ||
    has("policy") ||
    has("claim") ||
    has("cover");

  if (mentionsSchengen && mentionsInsuranceTopic) {
    links.push({
      url: "https://www.travl.ae/travel-insurance/schengen-visa",
      anchor_hint:
        "varied: e.g. 'Schengen-compliant travel insurance', 'embassy-accepted Schengen insurance from AED 30', 'Travl's Schengen insurance plan'",
      context:
        "Link to Travl's Schengen-compliant travel insurance (EUR 30,000 medical cover, accepted by VFS Global and BLS International, issued by AXA, from AED 30).",
      required: true,
    });
  } else if (mentionsAnnual) {
    links.push({
      url: "https://www.travl.ae/travel-insurance/annual-multi-trip",
      anchor_hint:
        "varied: e.g. 'annual multi-trip insurance', 'yearly travel cover from AED 245', 'Travl's annual plan'",
      context:
        "Link to Travl's annual multi-trip travel insurance (12-month policy, unlimited trips, from AED 245, ideal for frequent travellers).",
      required: true,
    });
  } else if (mentionsMedical) {
    links.push({
      url: "https://www.travl.ae/travel-insurance/medical",
      anchor_hint:
        "varied: e.g. 'travel medical insurance', 'medical cover abroad', 'Travl's medical travel plan'",
      context:
        "Link to Travl's travel medical insurance — emergency medical, hospitalisation, repatriation, and COVID-19 cover.",
      required: true,
    });
  } else if (mentionsInternational) {
    links.push({
      url: "https://www.travl.ae/travel-insurance/international",
      anchor_hint:
        "varied: e.g. 'international travel insurance', 'worldwide cover from AED 70', 'Travl's international plan'",
      context:
        "Link to Travl's international travel insurance (worldwide coverage with EUR 80,000+ medical, trip cancellation, baggage and flight-delay cover, from AED 70).",
      required: true,
    });
  } else if (mentionsSingleTrip) {
    links.push({
      url: "https://www.travl.ae/travel-insurance/single-trip",
      anchor_hint:
        "varied: e.g. 'single-trip travel insurance', 'one-trip cover for your journey'",
      context:
        "Link to Travl's single-trip travel insurance — coverage for one journey between specific travel dates, Schengen-compliant, issued by AXA.",
      required: true,
    });
  } else if (mentionsInsuranceTopic) {
    links.push({
      url: "https://www.travl.ae/travel-insurance",
      anchor_hint:
        "varied: e.g. 'Travl travel insurance', 'AXA-issued travel cover', 'travel insurance plans for UAE residents'",
      context:
        "Link to the Travl travel insurance hub — overview of all plans, booking form, and comparison.",
      required: true,
    });
  }

  return links;
}

/**
 * Renders the required-links list as a prompt block. Returns an empty string
 * if there are none, so the prompt stays clean for non-matching topics.
 */
export function formatRequiredLinksBlock(links) {
  if (links.length === 0) return "";

  const items = links
    .map(
      (link, i) =>
        `${i + 1}. URL: ${link.url}
   Anchor text styles: ${link.anchor_hint}
   How to use: ${link.context}`,
    )
    .join("\n\n");

  return `## Required Internal Links (MANDATORY — non-negotiable)

You MUST include each of the following links at least once in the body content, using natural, varied anchor text. Do not skip any. Do not stuff them all into one paragraph — distribute them across sections where they add value to the reader.

${items}

If you cannot work a link in naturally, write an extra sentence that creates the opening. Do not omit it.`;
}

/**
 * Hard-fails if any required link URL is missing from both parsed.content
 * and parsed.ctaBlock. Logs each missing URL via console.error and throws.
 */
export function validateRequiredLinks(parsed, requiredLinks) {
  const missing = requiredLinks.filter(
    (link) =>
      !parsed.content.includes(link.url) &&
      !parsed.ctaBlock.includes(link.url),
  );
  if (missing.length > 0) {
    console.error(
      `❌ Required internal links missing from generated content (${missing.length}):`,
    );
    for (const link of missing) console.error(`   - ${link.url}`);
    throw new Error(
      `Claude omitted ${missing.length} required link(s): ${missing.map((l) => l.url).join(", ")}`,
    );
  }
}

// ── HTML / text utilities ────────────────────────────────────────────────────

/** Strips HTML tags and collapses whitespace. Returns visible text only. */
export function stripHtmlToText(html) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Word count of HTML body content (strips tags first). */
export function countWords(html) {
  const text = stripHtmlToText(html);
  return text ? text.split(/\s+/).length : 0;
}

// ── Content-quality validation ───────────────────────────────────────────────

/**
 * Runs four quality checks against generated content.
 *
 *   1. Min word count for the tier (hard fail)
 *   2. No external links in the HTML body (hard fail)
 *   3. Em dash usage (soft warn)
 *   4. Banned words (soft warn)
 *
 * Hard failures throw; soft failures log via console.warn and return.
 */
export function validateContentQuality(parsed, lengthTier) {
  const content = parsed.content;
  const text = stripHtmlToText(content);

  // 1. Hard: minimum word count.
  const wordCount = text ? text.split(/\s+/).length : 0;
  const minWords = MIN_WORD_COUNT[lengthTier];
  if (wordCount < minWords) {
    console.error(
      `❌ Content under minimum length: ${wordCount} words (${lengthTier} tier requires ≥ ${minWords})`,
    );
    throw new Error(
      `Content too short: ${wordCount} words, ${lengthTier} tier requires ≥ ${minWords}`,
    );
  }

  // 2. Hard: no external links.
  const hrefRegex = /<a\s+[^>]*?href\s*=\s*["']([^"']+)["']/gi;
  const externalLinks = [];
  let m;
  while ((m = hrefRegex.exec(content)) !== null) {
    const url = m[1];
    const allowed =
      url.startsWith("/") ||
      ALLOWED_LINK_PREFIXES.some((prefix) => url.startsWith(prefix));
    if (!allowed) externalLinks.push(url);
  }
  if (externalLinks.length > 0) {
    console.error(
      `❌ External links found in content (${externalLinks.length}) — prompt forbids these:`,
    );
    for (const url of externalLinks) console.error(`   - ${url}`);
    throw new Error(
      `Content contains ${externalLinks.length} forbidden external link(s): ${externalLinks.join(", ")}`,
    );
  }

  // 3. Soft: em dash count.
  const emDashCount = (content.match(/—/g) || []).length;
  if (emDashCount > 0) {
    console.warn(
      `⚠  Generated content contains ${emDashCount} em dash(es) — prompt forbids these`,
    );
  }

  // 4. Soft: banned words.
  const foundBanned = BANNED_WORDS.filter((word) =>
    new RegExp(`\\b${word}\\b`, "i").test(text),
  );
  if (foundBanned.length > 0) {
    console.warn(
      `⚠  Generated content contains banned words: ${foundBanned.join(", ")}`,
    );
  }
}

// ── Cover image helpers ──────────────────────────────────────────────────────

/**
 * Derives a concise Unsplash search query from a blog topic title. Strips
 * common question words and filler so we get a clean visual concept.
 */
export function topicToSearchQuery(title) {
  const stopWords = new Set([
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
    "with", "by", "from", "is", "are", "was", "were", "be", "been", "do",
    "does", "did", "have", "has", "had", "will", "would", "can", "could",
    "should", "may", "might", "shall", "need", "how", "what", "why", "when",
    "where", "who", "which", "that", "this", "these", "those", "your", "my",
    "our", "their", "its", "i", "you", "we", "they", "he", "she", "it", "not",
    "no", "nor", "so", "yet", "both", "either", "neither", "whether", "if",
    "than", "as", "up", "out", "about", "into", "through", "during", "before",
    "after", "above", "below", "between", "each", "more", "most", "other",
    "some", "such", "only", "own", "same", "too", "very", "just", "because",
    "while", "although", "though", "since", "until", "unless",
  ]);

  const words = title
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w.toLowerCase()));

  return words.slice(0, 4).join(" ") || "travel";
}

/**
 * Fetches a relevant cover image from Unsplash based on the blog topic.
 * Falls back to a picsum placeholder if Unsplash is unconfigured or fails.
 */
export async function fetchCoverImage(topicTitle) {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn("⚠  UNSPLASH_ACCESS_KEY not set — using picsum placeholder");
    return fetchPlaceholderCoverImage();
  }

  const query = topicToSearchQuery(topicTitle);
  console.log(`Searching Unsplash for: "${query}"`);

  try {
    const searchRes = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=5&order_by=relevant`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          "Accept-Version": "v1",
        },
      },
    );

    if (!searchRes.ok) {
      throw new Error(`Unsplash search failed: ${searchRes.status}`);
    }

    const searchData = await searchRes.json();
    const photos = searchData?.results ?? [];

    if (photos.length === 0) {
      console.warn(
        `⚠  No Unsplash results for "${query}" — using picsum placeholder`,
      );
      return fetchPlaceholderCoverImage();
    }

    const photo = photos[0];
    const imageUrl = photo.urls?.regular;

    if (!imageUrl) {
      throw new Error("Unsplash photo has no regular URL");
    }

    // Trigger the required download ping (Unsplash API guidelines)
    fetch(photo.links?.download_location, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    }).catch(() => {});

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      throw new Error(`Failed to download Unsplash image: ${imgRes.status}`);
    }

    const arrayBuffer = await imgRes.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "image/jpeg" });

    const credit = photo.user?.name
      ? ` (Photo by ${photo.user.name} on Unsplash)`
      : "";
    console.log(`✓ Fetched Unsplash image${credit} (${blob.size} bytes)`);
    return blob;
  } catch (err) {
    console.warn(
      `⚠  Unsplash fetch failed (${err.message}) — falling back to picsum`,
    );
    return fetchPlaceholderCoverImage();
  }
}

/** Picsum fallback — random travel-ish landscape image. */
export async function fetchPlaceholderCoverImage() {
  const seed = `travl-${Date.now()}`;
  const url = `https://picsum.photos/seed/${seed}/1200/630.jpg`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch placeholder cover image: ${res.status} ${res.statusText}`,
    );
  }
  const arrayBuffer = await res.arrayBuffer();
  return new Blob([arrayBuffer], { type: "image/jpeg" });
}
