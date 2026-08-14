/**
 * Usage:
 *   node generate-blog-draft.mjs
 *
 * Env: ANTHROPIC_API_KEY, TRAVL_ADMIN_EMAIL, TRAVL_ADMIN_PASSWORD
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import {
  BACKEND_URL,
  LENGTH_TIERS,
  apiFetch,
  login,
  fetchBlogTags,
  getRequiredLinks,
  formatRequiredLinksBlock,
  validateRequiredLinks,
  validateContentQuality,
  fetchCoverImage,
} from "./lib/blog-utils.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

function getTodayUAE() {
  const now = new Date();
  const uaeOffset = 4 * 60 * 60 * 1000;
  const uaeNow = new Date(now.getTime() + uaeOffset);
  return uaeNow.toISOString().slice(0, 10);
}

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

async function fetchPublishedPosts(token) {
  const data = await apiFetch("/api/blogs?limit=50&page=1", {
    headers: { Cookie: `jwt=${token}` },
  });
  const posts = data?.data?.blogs ?? [];
  return posts.map((p) => ({ title: p.title, slug: p.slug }));
}

async function checkTitleExists(token, title) {
  const data = await apiFetch(`/api/blogs/admin/list?page=1&limit=1000`, {
    headers: { Cookie: `jwt=${token}` },
  });
  const posts = data?.data?.blogs ?? [];
  const normalise = (s) => s.trim().toLowerCase();
  return posts.some((p) => normalise(p.title) === normalise(title));
}

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

  const lengthTier = LENGTH_TIERS[topic.length] ? topic.length : "medium";
  const { wordRange, maxTokens } = LENGTH_TIERS[lengthTier];
  if (!LENGTH_TIERS[topic.length]) {
    console.warn(
      `⚠  Topic "${topic.title}" has no/invalid length (${topic.length}) — defaulting to medium`,
    );
  }

  const requiredLinks = getRequiredLinks(topic);
  const requiredLinksBlock = formatRequiredLinksBlock(requiredLinks);

  console.log(
    `Length tier: ${lengthTier} (${wordRange}, max_tokens=${maxTokens})`,
  );
  console.log(`Required internal links: ${requiredLinks.length}`);

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

${requiredLinksBlock}

## Writing Rules
- British English spelling (traveller, colour, recognise, etc.)
- Practical, actionable content — readers want real information
- Naturally weave in links to Travl's own pages (see Internal Linking Priority in the context)
- Do NOT invent specific statistics, prices (unless they match what's in the site context), or policy names
- Content must be substantive: ${wordRange} of HTML body content
- Use proper HTML: <h2>, <h3>, <p>, <ul>/<li>, <strong>, <a href="..."> tags
- Internal links: use full URL (https://www.travl.ae/... or https://www.dummyticket365.com) in <a href> attributes
- External links: DO NOT add external links — internal only
- The HTML content must NOT include <html>, <head>, <body>, or <title> tags — just body content starting with an introductory <p>
- NO em dashes (—) anywhere in the content. Replace with a comma, a colon, or split into a separate sentence.
- Paragraph length: MAXIMUM 2–3 sentences per <p> tag. If a thought runs longer, break it into two <p> tags. Never write a wall-of-text paragraph.
- Forbidden words — never use any of these: utilize, delve, leverage, furthermore, navigate, crucial, seamlessly, robust, streamline, unlock, moreover, therefore, additionally, notably, importantly, comprehensive, transformative, pivotal, paramount, multifaceted, nuanced, groundbreaking, cutting-edge, game-changing, in today's world, when it comes to, rest assured, certainly, absolutely, of course, it is worth noting, it is important to note, in conclusion, in summary

## GEO / AI-Citation Rules (CRITICAL)
- The article body MUST open with a short introductory <p> (2–3 sentences) that directly answers the title question. The first <h2> comes AFTER this opening paragraph. Do NOT start the content with an <h2>.
- Lead every section's first sentence with the core claim or verdict, not setup. AI engines extract the opening sentence of a section, so it must stand on its own.
- Each <h2> should match a real question a user would ask (question-style or clear topic phrasing), so it maps to search and AI queries.
- Be specific and verifiable: include concrete details (a number, a named requirement, a specific term like PNR, EUR 30,000, AED 30) rather than vague phrasing. Specific claims get cited; vague ones do not.
- Avoid hedging words ("most", "generally", "typically", "in most cases", "usually") unless the hedge is genuinely necessary for accuracy. Prefer a definitive statement with the exception named inline.
- Every answer block and FAQ answer must be fully self-contained: it should make complete sense read in isolation, with no references to "as mentioned above" or "see below".

## CTA Block (REQUIRED OUTPUT FIELD: ctaBlock)
You must also return a "ctaBlock" field — a self-contained HTML callout that will be appended to the bottom of the article. Rules:
- Outer element must be <div class="travl-cta">
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
</div>`;

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
  "quickAnswer": "Plain-text direct answer to the title question, 40–80 words. MUST lead with a definitive verdict in the first sentence (e.g. 'Yes,', 'No,', 'You need...'). MUST include at least one concrete, verifiable detail (a number, named requirement, or specific term). MUST be fully self-contained. Avoid hedging words like 'most', 'generally', 'typically'. This is the single most-cited block by AI search engines, so make it specific and quotable.",
  "content": "Full HTML body content, ${wordRange}, with proper headings, paragraphs, and internal links. MUST open with a short introductory <p> (2–3 sentences) that directly answers the title question — do NOT start with an <h2>. The first <h2> comes after the opening paragraph. Each <h2> should match a question a user would actually ask. Lead each section with its core claim. Keep every <p> to 2–3 sentences maximum. Must include every link listed under 'Required Internal Links' in the system prompt.",
  "ctaBlock": "Self-contained HTML callout starting with <div class=\\"travl-cta\\">, matching the CTA Block rules in the system prompt.",
  "faqs": [
    { "question": "Phrase exactly as a user would type/ask it", "answer": "Self-contained answer, 30–60 words, verdict-first, with a specific detail. No references to other parts of the article." },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." }
  ],
  "tags": ["tag name 1", "tag name 2", "tag name 3"]
}

All values must be strings or arrays of strings/objects as shown. The "content" and "ctaBlock" fields must each be a single string of HTML. The "faqs" field must be an array of exactly 5 objects each with "question" and "answer" string fields.`;

  console.log(`Generating content for: ${topic.title}`);

  let message;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      break;
    } catch (err) {
      if (attempt === 3) throw err;
      console.warn(`⚠  Attempt ${attempt} failed (${err.message}) — retrying in ${attempt * 10}s...`);
      await new Promise((r) => setTimeout(r, attempt * 10_000));
    }
  }

  const rawText = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

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

  const required = [
    "metaTitle",
    "metaDescription",
    "excerpt",
    "quickAnswer",
    "content",
    "ctaBlock",
    "faqs",
    "tags",
  ];
  for (const key of required) {
    if (!parsed[key]) throw new Error(`Claude response missing field: ${key}`);
  }

  validateRequiredLinks(parsed, requiredLinks);

  validateContentQuality(parsed, lengthTier);

  console.log("✓ Blog content generated");
  return parsed;
}

async function postDraft({ token, topic, content, availableTags }) {
  const lowerAvailable = availableTags.map((t) => t.toLowerCase());
  const validatedTags = content.tags.filter((t) => {
    const isValid = lowerAvailable.includes(t.toLowerCase());
    if (!isValid)
      console.warn(`⚠ Tag "${t}" not found in available tags — skipping`);
    return isValid;
  });

  const coverImageBlob = await fetchCoverImage(topic.title);

  const finalContent = `${content.content}\n${content.ctaBlock}`;
  console.log("✓ Appended ctaBlock to article body");

  const form = new FormData();
  form.append("title", topic.title);
  form.append("content", finalContent);
  form.append("excerpt", content.excerpt);
  form.append("quickAnswer", content.quickAnswer);
  form.append("metaTitle", content.metaTitle);
  form.append("metaDescription", content.metaDescription);
  form.append("status", "published");
  form.append("faqs", JSON.stringify(content.faqs));
  form.append("coverImage", coverImageBlob, "cover-placeholder.jpg");

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
      `Failed to create post: ${res.status} ${JSON.stringify(body)}`,
    );
  }

  const blogId = body?.data?._id || body?.data?.id;
  const slug = body?.data?.slug;
  console.log(`✓ Published — ID: ${blogId}, slug: ${slug}`);
  return body.data;
}

async function main() {
  console.log(`\n=== Travl Blog Draft Generator ===`);
  console.log(`Date (UAE): ${getTodayUAE()}\n`);

  const topic = getTodaysTopic();
  console.log(`Topic: ${topic.title}`);

  const token = await login();

  const alreadyExists = await checkTitleExists(token, topic.title);
  if (alreadyExists) {
    console.log(`⏭  Post "${topic.title}" already exists — skipping.`);
    return;
  }

  const [publishedPosts, availableTags] = await Promise.all([
    fetchPublishedPosts(token),
    fetchBlogTags(token),
  ]);
  console.log(
    `✓ Fetched ${publishedPosts.length} published posts, ${availableTags.length} tags`,
  );

  const siteContext = readFileSync(join(__dirname, "site-context.md"), "utf8");

  const content = await generateBlogContent({
    topic,
    siteContext,
    publishedPosts,
    availableTags,
  });

  const draft = await postDraft({ token, topic, content, availableTags });

  console.log(`\n✅ Done! Published "${draft?.title}" — now live.`);
  console.log(`   Live at: https://www.travl.ae/blog/${draft?.slug}`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
