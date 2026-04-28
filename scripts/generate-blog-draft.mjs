/**
 * generate-blog-draft.mjs
 *
 * Daily automation: picks today's topic from topics.json (by UAE date UTC+4),
 * generates a full blog post using Claude, and POSTs it as a draft to the
 * Travl backend at https://api.travl.ae.
 *
 * Run:  node generate-blog-draft.mjs
 * Env:  ANTHROPIC_API_KEY, TRAVL_ADMIN_EMAIL, TRAVL_ADMIN_PASSWORD
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────

const BACKEND_URL = "https://api.travl.ae";
const ADMIN_EMAIL = process.env.TRAVL_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.TRAVL_ADMIN_PASSWORD;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns today's date in YYYY-MM-DD format using UAE timezone (UTC+4). */
function getTodayUAE() {
  const now = new Date();
  // UTC+4
  const uaeOffset = 4 * 60 * 60 * 1000;
  const uaeNow = new Date(now.getTime() + uaeOffset);
  return uaeNow.toISOString().slice(0, 10);
}

/** Fetches with error handling. Returns parsed JSON or throws. */
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

/**
 * Like apiFetch but also returns the raw response (so callers can read headers).
 */
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

/** Extracts the `jwt=...` value from one or more Set-Cookie headers. */
function extractJwtCookie(res) {
  // Node's fetch exposes set-cookie via getSetCookie() (Node 22+) or as a single
  // comma-joined header value.
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

// ── Step 1: Resolve today's topic ─────────────────────────────────────────────

function getTodaysTopic() {
  const topics = JSON.parse(
    readFileSync(join(__dirname, "topics.json"), "utf8"),
  );
  const today = getTodayUAE();
  const entry = topics.find((t) => t.date === today);
  if (!entry) {
    throw new Error(`No topic scheduled for ${today}. Check topics.json.`);
  }
  return entry;
}

// ── Step 2: Login ─────────────────────────────────────────────────────────────

async function login() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      "TRAVL_ADMIN_EMAIL and TRAVL_ADMIN_PASSWORD env vars are required.",
    );
  }
  const { res, body } = await apiFetchRaw("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  // Backend sets the JWT as an httpOnly cookie; the response body contains
  // only user data. Extract the token from the Set-Cookie header.
  const token =
    extractJwtCookie(res) || body?.data?.token || body?.token || null;
  if (!token)
    throw new Error(
      `Login succeeded but no token returned: ${JSON.stringify(body)}`,
    );
  console.log("✓ Logged in");
  return token;
}

// ── Step 3: Fetch context data ────────────────────────────────────────────────

async function fetchPublishedPosts(token) {
  const data = await apiFetch("/api/blogs?limit=50&page=1", {
    headers: { Cookie: `jwt=${token}` },
  });
  // Return array of { title, slug } for internal linking suggestions
  const posts = data?.data?.blogs ?? [];
  return posts.map((p) => ({ title: p.title, slug: p.slug }));
}

async function fetchBlogTags(token) {
  const data = await apiFetch("/api/blog-tags", {
    headers: { Cookie: `jwt=${token}` },
  });
  const tags = data?.data ?? [];
  return tags.map((t) => t.name);
}

// ── Step 4: Generate blog content with Claude ─────────────────────────────────

async function generateBlogContent({
  topic,
  siteContext,
  publishedPosts,
  availableTags,
}) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY env var is required.");
  }

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const relatedPostsText =
    publishedPosts.length > 0
      ? publishedPosts
          .slice(0, 20)
          .map((p) => `- ${p.title} → https://www.travl.ae/blog/${p.slug}`)
          .join("\n")
      : "None yet.";

  const systemPrompt = `You are an expert travel content writer for Travl.ae, a UAE-based travel services platform. You write SEO-optimised blog posts targeting UAE residents and expats.

${siteContext}

## Published Posts (for internal linking)
${relatedPostsText}

## Writing Rules
- British English spelling (traveller, colour, recognise, etc.)
- Practical, actionable content — readers want real information
- Naturally weave in links to Travl's own pages (see Internal Linking Priority in the context)
- Do NOT invent specific statistics, prices (unless they match what's in the site context), or policy names
- Content must be substantive: 700–900 words of HTML body content
- Use proper HTML: <h2>, <h3>, <p>, <ul>/<li>, <strong>, <a href="..."> tags
- Internal links: use full URL (https://www.travl.ae/...) in <a href> attributes
- External links: DO NOT add external links — internal only
- The HTML content must NOT include <html>, <head>, <body>, or <title> tags — just body content starting with an introductory <p>`;

  const userPrompt = `Write a complete blog post for the following topic:

**Title:** ${topic.title}

## Available Tags
Choose 3–5 tags from this list that best match the article. Use EXACT names:
${availableTags.join(", ")}

## Required Output Format
Respond with a single valid JSON object (no markdown code fences, no extra text) with these exact keys:

{
  "metaTitle": "SEO meta title, 50–60 characters",
  "metaDescription": "SEO meta description, 150–160 characters",
  "excerpt": "2–3 sentence plain-text summary for blog listing, no HTML",
  "quickAnswer": "1–2 sentence plain-text direct answer to the question in the title (shown as a featured snippet)",
  "content": "Full HTML body content, 700–900 words, with proper headings, paragraphs, and internal links",
  "faqs": [
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." }
  ],
  "tags": ["tag name 1", "tag name 2", "tag name 3"]
}

All values must be strings or arrays of strings/objects as shown. The "content" field must be a single string of HTML. The "faqs" field must be an array of exactly 5 objects each with "question" and "answer" string fields.`;

  console.log(`Generating content for: ${topic.title}`);

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,

    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const message = await stream.finalMessage();
  const rawText = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Strip any accidental markdown code fences
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("Raw Claude response:\n", rawText.slice(0, 2000));
    throw new Error(`Claude returned invalid JSON: ${err.message}`);
  }

  // Validate required fields
  const required = [
    "metaTitle",
    "metaDescription",
    "excerpt",
    "quickAnswer",
    "content",
    "faqs",
    "tags",
  ];
  for (const key of required) {
    if (!parsed[key]) throw new Error(`Claude response missing field: ${key}`);
  }

  console.log("✓ Blog content generated");
  return parsed;
}

// ── Step 5: Post draft to backend ─────────────────────────────────────────────

/**
 * Fetches a placeholder cover image as a Blob. The backend requires a cover
 * image on creation, but drafts generated by this script are intended for
 * editorial review — the editor is expected to replace the placeholder with
 * a topic-relevant image before publishing.
 */
async function fetchPlaceholderCoverImage() {
  // picsum.photos: free, no auth, deterministic seed → stable test runs.
  // 1200x630 is the standard OG/Twitter card aspect ratio.
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

async function postDraft({ token, topic, content, availableTags }) {
  // Validate tags exist (case-insensitive match to be safe)
  const lowerAvailable = availableTags.map((t) => t.toLowerCase());
  const validatedTags = content.tags.filter((t) => {
    const isValid = lowerAvailable.includes(t.toLowerCase());
    if (!isValid)
      console.warn(`⚠ Tag "${t}" not found in available tags — skipping`);
    return isValid;
  });

  // Fetch a placeholder cover image (editor will replace before publishing).
  const coverImageBlob = await fetchPlaceholderCoverImage();
  console.log(`✓ Fetched placeholder cover image (${coverImageBlob.size} bytes)`);

  // Build multipart/form-data manually using FormData (Node 22 built-in)
  const form = new FormData();
  form.append("title", topic.title);
  form.append("content", content.content);
  form.append("excerpt", content.excerpt);
  form.append("quickAnswer", content.quickAnswer);
  form.append("metaTitle", content.metaTitle);
  form.append("metaDescription", content.metaDescription);
  form.append("status", "draft");
  form.append("faqs", JSON.stringify(content.faqs));
  form.append("coverImage", coverImageBlob, "cover-placeholder.jpg");

  // Tags: append each as a separate entry (array)
  for (const tag of validatedTags) {
    form.append("tags[]", tag);
  }

  const res = await fetch(`${BACKEND_URL}/api/blogs`, {
    method: "POST",
    headers: { Cookie: `jwt=${token}` },
    body: form,
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Failed to create draft: ${res.status} ${JSON.stringify(body)}`,
    );
  }

  const blogId = body?.data?._id || body?.data?.id;
  const slug = body?.data?.slug;
  console.log(`✓ Draft created — ID: ${blogId}, slug: ${slug}`);
  return body.data;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Travl Blog Draft Generator ===`);
  console.log(`Date (UAE): ${getTodayUAE()}\n`);

  // 1. Resolve today's topic
  const topic = getTodaysTopic();
  console.log(`Topic: ${topic.title}`);

  // 2. Login
  const token = await login();

  // 3. Fetch context
  const [publishedPosts, availableTags] = await Promise.all([
    fetchPublishedPosts(token),
    fetchBlogTags(token),
  ]);
  console.log(
    `✓ Fetched ${publishedPosts.length} published posts, ${availableTags.length} tags`,
  );

  // 4. Load site context
  const siteContext = readFileSync(join(__dirname, "site-context.md"), "utf8");

  // 5. Generate content
  const content = await generateBlogContent({
    topic,
    siteContext,
    publishedPosts,
    availableTags,
  });

  // 6. Post draft
  const draft = await postDraft({ token, topic, content, availableTags });

  console.log(`\n✅ Done! Draft "${draft?.title}" saved.`);
  console.log(`   Review at: https://www.travl.ae/admin/blogs`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
