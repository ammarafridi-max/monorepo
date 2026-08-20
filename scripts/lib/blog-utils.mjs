/**
 * Brand-neutral helpers for the blog generators.
 *
 * Everything brand-specific — backend URL, admin credential env vars, internal
 * link rules, CTA wording — lives in ./brands/<key>.mjs. Nothing in this file
 * may name a brand.
 */

const RECRAFT_API_KEY = process.env.RECRAFT_API_KEY;

export const LENGTH_TIERS = {
  short: { wordRange: "700–1000 words", maxTokens: 4000 },
  medium: { wordRange: "1200–1800 words", maxTokens: 6000 },
  long: { wordRange: "2500–3500 words", maxTokens: 8000 },
};

export const MIN_WORD_COUNT = {
  short: 600,
  medium: 1000,
  long: 2000,
};

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

/** Resolve a brand pack by key. Throws with the valid keys if it doesn't exist. */
export async function loadBrand(key) {
  try {
    const mod = await import(`./brands/${key}.mjs`);
    return mod.BRAND ?? mod.default;
  } catch (err) {
    if (err?.code === "ERR_MODULE_NOT_FOUND") {
      throw new Error(
        `Unknown brand "${key}". Add scripts/lib/brands/${key}.mjs to support it.`,
      );
    }
    throw err;
  }
}

/**
 * Everything that talks to a brand's backend. The brand supplies the base URL
 * and the names of its admin credential env vars, so two brands never share a
 * login by accident.
 */
export function createApiClient(brand) {
  const BACKEND_URL = brand.backendUrl;

  async function apiFetch(path, options = {}) {
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

  async function apiFetchRaw(path, options = {}) {
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

  async function login() {
    const email = process.env[brand.adminEmailEnv];
    const password = process.env[brand.adminPasswordEnv];
    if (!email || !password) {
      throw new Error(
        `${brand.adminEmailEnv} and ${brand.adminPasswordEnv} env vars are required.`,
      );
    }
    const { res, body } = await apiFetchRaw("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
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

  async function fetchBlogTags(token) {
    const data = await apiFetch("/api/blog-tags", {
      headers: { Cookie: `jwt=${token}` },
    });
    const tags = data?.data ?? [];
    return tags.map((t) => t.name);
  }

  /** Published posts, for the internal-linking section of the prompt. */
  async function fetchPublishedPosts(token) {
    const data = await apiFetch("/api/blogs?limit=50&page=1", {
      headers: { Cookie: `jwt=${token}` },
    });
    const posts = data?.data?.blogs ?? [];
    return posts.map((p) => ({ title: p.title, slug: p.slug }));
  }

  /** Draft and scheduled posts count too, so a re-run never double-publishes. */
  async function checkTitleExists(token, title) {
    const data = await apiFetch("/api/blogs/admin/list?page=1&limit=1000", {
      headers: { Cookie: `jwt=${token}` },
    });
    const posts = data?.data?.blogs ?? [];
    const normalise = (s) => s.trim().toLowerCase();
    return posts.some((p) => normalise(p.title) === normalise(title));
  }

  return { BACKEND_URL, apiFetch, apiFetchRaw, login, fetchBlogTags, fetchPublishedPosts, checkTitleExists };
}

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

export function validateRequiredLinks(parsed, requiredLinks) {
  const missing = requiredLinks.filter(
    (link) =>
      !parsed.content.includes(link.url) && !parsed.ctaBlock.includes(link.url),
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

/** True when a URL points at one of the brand's approved official sources. */
export function isCitationUrl(url, brand) {
  let host;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return (brand.citationDomains ?? []).some(
    (d) => host === d.toLowerCase() || host.endsWith(`.${d.toLowerCase()}`),
  );
}

/** Every official-source link in the post, deduplicated, in document order. */
export function extractCitations(html, brand) {
  const urls = [...(html || "").matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  return [...new Set(urls.filter((u) => isCitationUrl(u, brand)))];
}

/**
 * A YMYL post with no attributed sources is the failure mode we are trying to
 * prevent, so too few citations is a hard failure rather than a warning.
 */
export function validateCitations(parsed, brand, { minCitations }) {
  const citations = extractCitations(parsed.content, brand);
  if (citations.length < minCitations) {
    throw new Error(
      `Only ${citations.length} official source(s) cited, minimum is ${minCitations}. ` +
        `Approved domains: ${(brand.citationDomains ?? []).slice(0, 6).join(", ")}…`,
    );
  }
  if (!/id=["']sources["']|>\s*Sources\s*</i.test(parsed.content)) {
    throw new Error('Post is missing its "Sources" section.');
  }
  console.log(`✓ ${citations.length} official sources cited`);
  return citations;
}

/**
 * House style forbids em dashes and the model keeps producing them anyway.
 * Cheaper to fix mechanically than to fail an otherwise good post over
 * punctuation. A dash between clauses becomes a comma; a dash used as a range
 * or a bullet marker becomes a plain hyphen.
 */
export function stripEmDashes(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/&mdash;|&#8212;/gi, "—")
    .replace(/(<\/strong>)\s*—\s+/gi, "$1: ")  // "<strong>Label</strong> — detail" reads as a colon
    .replace(/\s+—\s+/g, ", ")     // clause break: "the fee — AED 30 — is" → ", "
    .replace(/—/g, "-")             // anything left is a range or a compound
    .replace(/,\s*,/g, ",")
    .replace(/,\s*([.;:!?])/g, "$1")
    .replace(/\s+,/g, ",")
    .replace(/,\s*(<\/(?:p|li|h2|h3|td|th)>)/gi, "$1");
}

/** Applied to every field that reaches a reader. */
export function stripEmDashesFromPost(parsed) {
  for (const key of ["metaTitle", "metaDescription", "excerpt", "quickAnswer", "content", "ctaBlock"]) {
    if (parsed[key]) parsed[key] = stripEmDashes(parsed[key]);
  }
  parsed.faqs = (parsed.faqs ?? []).map((f) => ({
    ...f,
    question: stripEmDashes(f.question),
    answer: stripEmDashes(f.answer),
  }));
  return parsed;
}

export function stripHtmlToText(html) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(html) {
  const text = stripHtmlToText(html);
  return text ? text.split(/\s+/).length : 0;
}

/**
 * `minWords` overrides the tier default. A brand using formats sets its own
 * floor from the format, which may not match the tier it is mapped from — a
 * Sourced Guide on a `long` topic targets 1400–2500, not the tier's 2000.
 */
export function validateContentQuality(parsed, lengthTier, brand, { minWords: floor } = {}) {
  const content = parsed.content;
  const text = stripHtmlToText(content);

  const wordCount = text ? text.split(/\s+/).length : 0;
  const minWords = floor ?? MIN_WORD_COUNT[lengthTier];
  if (wordCount < minWords) {
    console.error(
      `❌ Content under minimum length: ${wordCount} words (requires ≥ ${minWords})`,
    );
    throw new Error(
      `Content too short: ${wordCount} words, requires ≥ ${minWords}`,
    );
  }

  const hrefRegex = /<a\s+[^>]*?href\s*=\s*["']([^"']+)["']/gi;
  const externalLinks = [];
  let m;
  while ((m = hrefRegex.exec(content)) !== null) {
    const url = m[1];
    const allowed =
      url.startsWith("/") ||
      brand.allowedLinkPrefixes.some((prefix) => url.startsWith(prefix)) ||
      isCitationUrl(url, brand);
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

  // Brands can forbid specific link targets outright (a partner product we may
  // name but not link, a legacy path that only redirects).
  for (const rule of brand.forbiddenLinkPatterns ?? []) {
    const offenders = (content.match(/href\s*=\s*["']([^"']+)["']/gi) || []).filter((h) =>
      rule.pattern.test(h),
    );
    if (offenders.length) {
      console.error(`❌ Forbidden link (${offenders.length}): ${rule.message}`);
      for (const o of offenders) console.error(`   - ${o}`);
      throw new Error(`Forbidden link in content: ${rule.message}`);
    }
  }

  // Brands can forbid specific claims in the prose — a partner's product
  // attributed to the wrong brand, or priced in the wrong currency.
  const faqText = stripHtmlToText(
    (parsed.faqs ?? []).map((f) => `${f.question} ${f.answer}`).join(" "),
  );
  for (const check of brand.contentChecks ?? []) {
    const hit = `${text} ${faqText}`.match(check.pattern);
    if (hit) {
      console.error(`❌ ${check.message}`);
      console.error(`   offending text: "${hit[0].slice(0, 120)}"`);
      throw new Error(check.message);
    }
  }

  const emDashCount = (content.match(/—/g) || []).length;
  if (emDashCount > 0) {
    console.warn(
      `⚠  Generated content contains ${emDashCount} em dash(es) — prompt forbids these`,
    );
  }

  const foundBanned = BANNED_WORDS.filter((word) =>
    new RegExp(`\\b${word}\\b`, "i").test(text),
  );
  if (foundBanned.length > 0) {
    console.warn(
      `⚠  Generated content contains banned words: ${foundBanned.join(", ")}`,
    );
  }
}

function buildImagePrompt(title) {
  const skip = new Set([
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "do", "does", "did", "have", "has", "had", "will", "would", "can",
    "could", "should", "may", "might", "need", "how", "what", "why",
    "when", "where", "who", "which", "that", "this", "these", "those",
    "your", "my", "our", "their", "its", "not", "no", "nor", "so", "yet",
    "if", "than", "as", "up", "out", "about", "into", "before", "after",
    "between", "each", "more", "most", "other", "some", "such", "only",
    "too", "very", "just",
    "guide", "complete", "explained", "tips", "checklist", "step", "steps",
    "vs", "comparison", "best", "top", "get", "know", "actually",
    "practical", "residents", "expats", "applicants",
  ]);

  const words = title
    .replace(/[?:!,]/g, "")
    .replace(/\b\d{4}\b/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !skip.has(w.toLowerCase()));

  const subject = words.slice(0, 6).join(" ") || "travel";
  return `Professional travel photography, ${subject}, editorial style, soft natural light, wide shot, no text, no words, no letters, no watermarks, no labels`;
}

export async function fetchCoverImage(topicTitle, brand) {
  if (!RECRAFT_API_KEY) {
    console.warn("⚠  RECRAFT_API_KEY not set — using picsum placeholder");
    return fetchPlaceholderCoverImage(brand);
  }

  const prompt = buildImagePrompt(topicTitle);
  console.log(`Generating Recraft image: "${prompt}"`);

  try {
    const res = await fetch("https://external.api.recraft.ai/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RECRAFT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        negative_prompt: "text, words, letters, watermark, label, caption, title, heading, typography, font, signage",
        model: "recraftv3",
        style: "realistic_image",
        size: "1820x1024",
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Recraft API error: ${res.status} ${JSON.stringify(err)}`);
    }

    const data = await res.json();
    const imageUrl = data?.data?.[0]?.url;
    if (!imageUrl) throw new Error("Recraft response missing image URL");

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Failed to download Recraft image: ${imgRes.status}`);

    const arrayBuffer = await imgRes.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "image/webp" });
    console.log(`✓ Generated Recraft image (${blob.size} bytes)`);
    return blob;
  } catch (err) {
    console.warn(`⚠  Recraft generation failed (${err.message}) — falling back to picsum`);
    return fetchPlaceholderCoverImage(brand);
  }
}

export async function fetchPlaceholderCoverImage(brand) {
  const seed = `${brand?.key ?? "blog"}-${Date.now()}`;
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
