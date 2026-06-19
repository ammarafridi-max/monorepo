/**
 * expand-blog-post.mjs
 *
 * On-demand: takes an existing Travl blog post (by slug or title), asks
 * Claude to expand it to a longer target length, and saves the result as
 * a NEW DRAFT in the admin panel — never overwrites the live post.
 *
 * Usage:
 *   node expand-blog-post.mjs --slug "how-to-apply-schengen-visa-uae"
 *   node expand-blog-post.mjs --title "How to Apply for a Schengen Visa..."
 *   node expand-blog-post.mjs --slug "..." --length long
 *
 * Env:  ANTHROPIC_API_KEY, TRAVL_ADMIN_EMAIL, TRAVL_ADMIN_PASSWORD
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import {
  BACKEND_URL,
  LENGTH_TIERS,
  MIN_WORD_COUNT,
  apiFetch,
  login,
  fetchBlogTags,
  getRequiredLinks,
  formatRequiredLinksBlock,
  validateRequiredLinks,
  validateContentQuality,
  countWords,
  fetchCoverImage,
} from "./lib/blog-utils.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ── Argument parsing ─────────────────────────────────────────────────────────

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (
      (arg === "--slug" || arg === "--title" || arg === "--length") &&
      argv[i + 1]
    ) {
      opts[arg.slice(2)] = argv[i + 1];
      i++;
    } else if (arg === "--help" || arg === "-h") {
      opts.help = true;
    }
  }
  return opts;
}

function usage() {
  console.error(`Usage:
  node expand-blog-post.mjs --slug <slug>            # find by exact slug
  node expand-blog-post.mjs --title "<title>"        # find by exact title (case-insensitive)
  node expand-blog-post.mjs --slug ... --length long # override target length (short|medium|long, default: long)

Env: ANTHROPIC_API_KEY, TRAVL_ADMIN_EMAIL, TRAVL_ADMIN_PASSWORD`);
}

// ── Find the existing post ───────────────────────────────────────────────────

/**
 * Looks up a single post via the admin list endpoint by slug (exact) or title
 * (case-insensitive, trimmed). Returns the post record. Throws on 0 matches;
 * lists candidates and exits on >1 matches.
 */
async function findPost(token, { slug, title }) {
  const data = await apiFetch("/api/blogs/admin/list?page=1&limit=1000", {
    headers: { Cookie: `jwt=${token}` },
  });
  const posts = data?.data?.blogs ?? [];
  console.log(`✓ Admin list returned ${posts.length} posts`);

  let matches = [];
  if (slug) {
    matches = posts.filter((p) => p.slug === slug);
  } else if (title) {
    const needle = title.trim().toLowerCase();
    matches = posts.filter(
      (p) =>
        typeof p.title === "string" && p.title.trim().toLowerCase() === needle,
    );
  }

  if (matches.length === 0) {
    throw new Error(
      `No post found matching ${slug ? `slug="${slug}"` : `title="${title}"`}`,
    );
  }
  if (matches.length > 1) {
    console.error(`❌ Multiple posts matched — refusing to guess. Candidates:`);
    for (const m of matches) {
      console.error(
        `   - id=${m._id || m.id} | slug=${m.slug} | title=${m.title}`,
      );
    }
    process.exit(1);
  }
  return matches[0];
}

/**
 * Looks for a post (draft or published) whose title exactly matches
 * `draftTitle` (case-insensitive, trimmed). Returns the record or null.
 */
async function findExistingDraft(token, draftTitle) {
  const data = await apiFetch("/api/blogs/admin/list?page=1&limit=1000", {
    headers: { Cookie: `jwt=${token}` },
  });
  const posts = data?.data?.blogs ?? [];
  const needle = draftTitle.trim().toLowerCase();
  return (
    posts.find(
      (p) =>
        typeof p.title === "string" && p.title.trim().toLowerCase() === needle,
    ) || null
  );
}

/**
 * The admin list may return a summary. If the matched record is missing the
 * full body content, fetch the complete record from /api/blogs/:id.
 */
async function ensureFullPost(token, post) {
  if (post.content && post.content.length > 0) return post;
  const id = post._id || post.id;
  console.log(
    `Post summary missing 'content' — fetching full record /api/blogs/${id}`,
  );
  const data = await apiFetch(`/api/blogs/${id}`, {
    headers: { Cookie: `jwt=${token}` },
  });
  return data?.data ?? post;
}

// ── Cover image: reuse existing if possible ──────────────────────────────────

/**
 * Downloads the existing post's cover image so we can re-upload it with the
 * new draft. Falls back to fetchCoverImage(title) if the existing image
 * can't be fetched, logging a clear warning so the operator knows the cover
 * will need manual replacement.
 */
async function buildCoverBlob(post) {
  const coverUrl =
    post.coverImage?.url || post.coverImage || post.coverImageUrl || null;

  if (!coverUrl) {
    console.warn(
      "⚠  Existing post has no cover image URL — generating fresh Recraft image",
    );
    return fetchCoverImage(post.title);
  }

  try {
    console.log(`Re-using existing cover image: ${coverUrl}`);
    const res = await fetch(coverUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    return new Blob([arrayBuffer], { type: contentType });
  } catch (err) {
    console.warn(
      `⚠  Could not download existing cover (${err.message}) — fetching a fresh one. The new draft will have a DIFFERENT cover image and may need manual fixing.`,
    );
    return fetchCoverImage(post.title);
  }
}

// ── Expansion prompt ─────────────────────────────────────────────────────────

async function expandBlogContent({
  post,
  siteContext,
  availableTags,
  targetLength,
}) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY env var is required.");
  }

  const { wordRange, maxTokens } = LENGTH_TIERS[targetLength];

  const requiredLinks = getRequiredLinks({ title: post.title });
  const requiredLinksBlock = formatRequiredLinksBlock(requiredLinks);

  console.log(
    `Target tier: ${targetLength} (${wordRange}, max_tokens=${maxTokens})`,
  );
  console.log(`Required internal links: ${requiredLinks.length}`);

  const systemPrompt = `You are an expert travel content writer for Travl.ae, a UAE-based travel services platform. You write SEO-optimised blog posts targeting UAE residents and expats.

${siteContext}

${requiredLinksBlock}

## Writing Rules
- British English spelling (traveller, colour, recognise, etc.)
- Practical, actionable content — readers want real information
- Naturally weave in links to Travl's own pages (see Internal Linking Priority in the context)
- Do NOT invent specific statistics, prices (unless they match what's in the site context), or policy names
- Expanded content must be substantive: ${wordRange} of HTML body content
- Use proper HTML: <h2>, <h3>, <p>, <ul>/<li>, <strong>, <a href="..."> tags
- Internal links: use full URL (https://www.travl.ae/... or https://www.dummyticket365.com) in <a href> attributes
- External links: DO NOT add external links — internal only
- The HTML content must NOT include <html>, <head>, <body>, or <title> tags — just body content starting with an introductory <p>

## CTA Block (REQUIRED OUTPUT FIELD: ctaBlock)
You must also return a "ctaBlock" field — a self-contained HTML callout that will be appended to the bottom of the article. Rules:
- Outer element must be <div class="travl-cta">
- Must contain an <h3> headline and at least one <p> with a clear next-step link
- Use plain HTML only — no inline styles, no <script>, no <style>
- Match the article's primary intent:
  * Visa-application topics → CTA leads with Dummy Ticket 365 (https://www.dummyticket365.com) for the required flight reservation, mentions the hotel reservation service if accommodation is relevant to the topic, and briefly mentions the matching Travl visa assistance page (Schengen / UK / USA / Canada)
  * Insurance topics → CTA promotes the most relevant Travl travel insurance page
  * Generic travel topics → CTA promotes Travl travel insurance (https://www.travl.ae/travel-insurance)`;

  const userPrompt = `Write an EXPANDED version of an existing blog post.

**Title:** ${post.title}

The current article is below. Your job is to make it longer, deeper, and more useful — without removing accurate information that's already there.

## Existing Content

${post.content}

## How to expand

1. **Deepen existing sections.** For each H2, add more specific guidance, concrete examples, USD pricing where the site context supports it, and practical UAE-relevant detail. Replace vague sentences with concrete ones.
2. **Add new H2 sections that fill obvious gaps.** Look at the article structure and ask what a thorough reader would also want to know — for example, a country visa guide that lacks "Common Reasons for Rejection", "Processing Times", "What to Do After You Apply", or "Documents Checklist" should gain those sections.
3. **Preserve the existing voice and tone.** Keep British English spelling and the conversational style. Do not rewrite paragraphs the existing post already nailed — extend them.
4. **Keep every internal link that already exists in the original.** You may add more where they add value, but do not remove any existing href URL.
5. **Do NOT just pad with filler.** Every new sentence must add information the reader would actually want. No transitional fluff, no restated headings, no "in conclusion" rehashes.
6. **Refresh the meta fields and FAQs.** The expanded article warrants a refreshed metaTitle, metaDescription, excerpt, quickAnswer, FAQs, and tags — base them on the expanded body, not the original.

## Available Tags
Choose 3–5 tags from this list that best match the expanded article. Use EXACT names:
${availableTags.join(", ")}

## Required Output Format
Respond with a single valid JSON object (no markdown code fences, no extra text) with these exact keys:

{
  "metaTitle": "SEO meta title, 50–60 characters",
  "metaDescription": "SEO meta description, 150–160 characters",
  "excerpt": "2–3 sentence plain-text summary for blog listing, no HTML",
  "quickAnswer": "1–2 sentence plain-text direct answer to the question in the title",
  "content": "Expanded HTML body content, ${wordRange}, with proper headings, paragraphs, and internal links. Must include every link listed under 'Required Internal Links' in the system prompt AND every <a href> that was in the existing content.",
  "ctaBlock": "Self-contained HTML callout starting with <div class=\\"travl-cta\\">, matching the CTA Block rules in the system prompt.",
  "faqs": [
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." }
  ],
  "tags": ["tag name 1", "tag name 2", "tag name 3"]
}

All values must be strings or arrays of strings/objects as shown. The "content" and "ctaBlock" fields must each be a single string of HTML. The "faqs" field must be an array of exactly 5 objects.`;

  console.log(`Expanding content for: ${post.title}`);

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const message = await stream.finalMessage();
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

  // Validate required fields
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

  // Required-links validator — fail loudly if Claude dropped a mandated link.
  validateRequiredLinks(parsed, requiredLinks);

  // Content-quality checks (word count floor, no external links, soft style
  // warnings). Hard failures throw; soft failures only warn.
  validateContentQuality(parsed, targetLength);

  console.log("✓ Expanded content generated");
  return parsed;
}

// ── Save as new draft ────────────────────────────────────────────────────────

async function postExpandedDraft({ token, post, content, availableTags }) {
  // Validate tags exist (case-insensitive match)
  const lowerAvailable = availableTags.map((t) => t.toLowerCase());
  const validatedTags = content.tags.filter((t) => {
    const isValid = lowerAvailable.includes(t.toLowerCase());
    if (!isValid)
      console.warn(`⚠ Tag "${t}" not found in available tags — skipping`);
    return isValid;
  });

  const coverImageBlob = await buildCoverBlob(post);

  // Append CTA block to the body (same pattern as the daily generator).
  const finalContent = `${content.content}\n${content.ctaBlock}`;
  console.log("✓ Appended ctaBlock to expanded article body");

  // Title gets " (expanded draft)" suffix so it's obvious in the admin list.
  const draftTitle = `${post.title} (expanded draft)`;

  const form = new FormData();
  form.append("title", draftTitle);
  form.append("content", finalContent);
  form.append("excerpt", content.excerpt);
  form.append("quickAnswer", content.quickAnswer);
  form.append("metaTitle", content.metaTitle);
  form.append("metaDescription", content.metaDescription);
  form.append("status", "draft");
  form.append("faqs", JSON.stringify(content.faqs));
  form.append("coverImage", coverImageBlob, "cover.jpg");
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
      `Failed to create expanded draft: ${res.status} ${JSON.stringify(body)}`,
    );
  }

  const blogId = body?.data?._id || body?.data?.id;
  const slug = body?.data?.slug;
  console.log(`✓ Expanded draft created — ID: ${blogId}, slug: ${slug}`);
  return body.data;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help || (!opts.slug && !opts.title)) {
    usage();
    process.exit(opts.help ? 0 : 1);
  }

  if (opts.length && !LENGTH_TIERS[opts.length]) {
    console.error(
      `❌ Invalid --length "${opts.length}". Must be one of: ${Object.keys(LENGTH_TIERS).join(", ")}`,
    );
    process.exit(1);
  }

  const targetLength = opts.length || "long";

  console.log(`\n=== Travl Blog Post Expander ===`);
  console.log(
    `Lookup: ${opts.slug ? `slug="${opts.slug}"` : `title="${opts.title}"`}`,
  );
  console.log(`Target length: ${targetLength}\n`);

  // 1. Login
  const token = await login();

  // 2. Resolve the existing post (and pull full body if needed).
  const summary = await findPost(token, { slug: opts.slug, title: opts.title });
  const post = await ensureFullPost(token, summary);
  const postId = post._id || post.id;
  console.log(
    `✓ Resolved post — id=${postId}, slug=${post.slug}, title="${post.title}"`,
  );

  // 3. Pre-flight duplicate check — bail out early if an expanded draft for
  //    this post already exists. Avoids overwriting nothing but also avoids
  //    burning an API call on a no-op.
  const draftTitle = `${post.title} (expanded draft)`;
  const existing = await findExistingDraft(token, draftTitle);
  if (existing) {
    const existingId = existing._id || existing.id;
    console.log(`⏭  An expanded draft already exists for this post:`);
    console.log(`     id:    ${existingId}`);
    console.log(`     slug:  ${existing.slug}`);
    console.log(`     admin: https://www.travl.ae/admin/blogs/${existingId}`);
    console.log(
      `An expanded draft already exists for this post. Delete it via the admin panel first, then re-run.`,
    );
    return;
  }

  // 4. Word-count gate.
  const currentWords = countWords(post.content || "");
  const floor = MIN_WORD_COUNT[targetLength];
  console.log(`Current word count: ${currentWords} | target floor: ${floor}`);

  if (currentWords >= floor) {
    console.log(
      `⏭  Post already meets the ${targetLength} floor (${currentWords} ≥ ${floor}). Nothing to expand.`,
    );
    return;
  }

  // 4. Fetch available tags + site context.
  const [availableTags, siteContext] = await Promise.all([
    fetchBlogTags(token),
    Promise.resolve(readFileSync(join(__dirname, "site-context.md"), "utf8")),
  ]);
  console.log(`✓ Fetched ${availableTags.length} available tags`);

  // 5. Expand. Validation happens inside expandBlogContent — anything that
  // fails will throw here and prevent the POST below.
  const expanded = await expandBlogContent({
    post,
    siteContext,
    availableTags,
    targetLength,
  });

  const newWordCount = countWords(expanded.content);
  console.log(
    `✓ Expansion complete: ${currentWords} → ${newWordCount} words (target ≥ ${floor})`,
  );

  // 6. Save as a new draft.
  const draft = await postExpandedDraft({
    token,
    post,
    content: expanded,
    availableTags,
  });

  const draftId = draft?._id || draft?.id;
  console.log(`\n✅ Done! Draft "${draft?.title}" saved.`);
  console.log(`   Original post id: ${postId}`);
  console.log(
    `   Review the expanded draft at: https://www.travl.ae/admin/blogs/${draftId}`,
  );
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
