/**
 * Generates and publishes one blog post for a brand, from that brand's topic
 * schedule. Everything brand-specific lives in lib/brands/<key>.mjs.
 *
 * Usage:
 *   node generate-blog-draft.mjs                    # defaults to travl
 *   node generate-blog-draft.mjs --brand visawadi
 *
 * Env: ANTHROPIC_API_KEY, RECRAFT_API_KEY, and the brand's admin credentials
 * (TRAVL_ADMIN_EMAIL / TRAVL_ADMIN_PASSWORD, VISAWADI_ADMIN_EMAIL / ...).
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import {
  LENGTH_TIERS,
  loadBrand,
  validateCitations,
  stripEmDashesFromPost,
  createApiClient,
  formatRequiredLinksBlock,
  validateRequiredLinks,
  validateContentQuality,
  fetchCoverImage,
} from "./lib/blog-utils.mjs";
import { resolveFormat } from "./lib/formats.mjs";
import { verifyDraft, assertVerification, isClean, buildRevisionBrief } from "./lib/verify.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-6";

/** Publish immediately by default; --status draft stages it for review instead. */
function parseFlag(argv, name) {
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  const inline = argv.find((a) => a.startsWith(`--${name}=`));
  return inline ? inline.split("=")[1] : null;
}

function parseStatusArg(argv) {
  const i = argv.indexOf("--status");
  const v = i !== -1 && argv[i + 1] ? argv[i + 1] : "published";
  if (!["published", "draft"].includes(v)) {
    throw new Error(`--status must be "published" or "draft", got "${v}"`);
  }
  return v;
}

const DRY_RUN = process.argv.includes("--dry-run");

function parseBrandArg(argv) {
  const i = argv.indexOf("--brand");
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  const inline = argv.find((a) => a.startsWith("--brand="));
  return inline ? inline.split("=")[1] : "travl";
}

function getTodayUAE() {
  const now = new Date();
  const uaeOffset = 4 * 60 * 60 * 1000;
  const uaeNow = new Date(now.getTime() + uaeOffset);
  return uaeNow.toISOString().slice(0, 10);
}

function parseDateArg(argv) {
  const i = argv.indexOf("--date");
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  const inline = argv.find((a) => a.startsWith("--date="));
  return inline ? inline.split("=")[1] : null;
}

function getTodaysTopic(brand, dateOverride) {
  const topics = JSON.parse(
    readFileSync(join(__dirname, brand.topicsFile), "utf8"),
  );
  const today = dateOverride || getTodayUAE();
  const entry = topics.find((t) => t.date === today);
  if (!entry) {
    throw new Error(`No topic scheduled for ${today}. Check ${brand.topicsFile}.`);
  }
  return entry;
}

async function generateBlogContent({
  brand,
  topic,
  siteContext,
  publishedPosts,
  availableTags,
  revision,
}) {
  if (!ANTHROPIC_API_KEY && !DRY_RUN) {
    throw new Error("ANTHROPIC_API_KEY env var is required.");
  }

  const client = DRY_RUN ? null : new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const lengthTier = LENGTH_TIERS[topic.length] ? topic.length : "medium";
  if (!LENGTH_TIERS[topic.length]) {
    console.warn(
      `⚠  Topic "${topic.title}" has no/invalid length (${topic.length}) — defaulting to medium`,
    );
  }
  const format = resolveFormat(brand, lengthTier);
  const { wordRange, maxTokens } = format ?? LENGTH_TIERS[lengthTier];

  if (format?.requiresFieldData && !brand.fieldData) {
    throw new Error(
      `Format "${format.name}" reports first-party data, but brand "${brand.key}" supplies none. ` +
        `Add fieldData to the brand, or map this tier to a format that does not require it.`,
    );
  }

  const requiredLinks = brand.getRequiredLinks(topic);
  const requiredLinksBlock = formatRequiredLinksBlock(requiredLinks);

  console.log(
    format
      ? `Format: ${format.name} — ${lengthTier} tier (${wordRange}, max_tokens=${maxTokens})`
      : `Length tier: ${lengthTier} (${wordRange}, max_tokens=${maxTokens})`,
  );

  const faqCount = format?.faqCount ?? 5;

  const POST_SCHEMA = {
    type: "object",
    properties: {
      metaTitle: { type: "string" },
      metaDescription: { type: "string" },
      excerpt: { type: "string" },
      quickAnswer: { type: "string" },
      content: { type: "string" },
      ctaBlock: { type: "string" },
      faqs: {
        type: "array",
        items: {
          type: "object",
          properties: { question: { type: "string" }, answer: { type: "string" } },
          required: ["question", "answer"],
          additionalProperties: false,
        },
      },
      tags: { type: "array", items: { type: "string" } },
    },
    required: [
      "metaTitle", "metaDescription", "excerpt", "quickAnswer",
      "content", "ctaBlock", "faqs", "tags",
    ],
    additionalProperties: false,
  };
  const faqExamples = [
    '    { "question": "Phrase exactly as a user would type/ask it", "answer": "Self-contained answer, 30–60 words, verdict-first, with a specific detail. No references to other parts of the article." }',
    ...Array.from({ length: faqCount - 1 }, () => '    { "question": "...", "answer": "..." }'),
  ].join(",\n");

  const formatBlock = format
    ? `\n## Article Format: ${format.name}\n\nStructure the article exactly like this:\n\n${format.skeleton}\n`
    : "";

  const sourcingBlock = format
    ? `\n## Sourcing Rules (CRITICAL — this is YMYL content)

Every fee, processing time, validity period, document requirement, eligibility rule and named form MUST be attributed to an official source, linked inline at the point the fact is stated.

- You may ONLY cite these domains: ${(brand.citationDomains ?? []).join(", ")}
- Never cite a blog, a forum, a news site, or an aggregator. A visa claim sourced to a blog is worth nothing.
- Link the specific page that states the fact, not a site's home page.
- Minimum ${format.minCitations} official sources in the article.
- End the article with a "Sources" section: an <h2>Sources</h2> followed by a <ul> listing each source as a link, naming the publisher.
- If you are not certain of a figure and cannot point to an official page for it, do not state it. Describe it in general terms instead, or leave it out. A missing number is recoverable; a wrong one is not.
- Do not attach a source link to a claim that source does not make. Every claim you link will be re-checked against the page it cites, and the post is rejected if the page does not support it.
`
    : "";
  console.log(`Required internal links: ${requiredLinks.length}`);

  const relatedPostsText =
    publishedPosts.length > 0
      ? publishedPosts
          .slice(0, 20)
          .map((p) => `- ${p.title} → ${brand.blogUrl(p.slug)}`)
          .join("\n")
      : "None yet.";

  const systemPrompt = `${brand.writerIdentity}

${siteContext}

## Published Posts (for internal linking)
${relatedPostsText}

${requiredLinksBlock}
${formatBlock}${sourcingBlock}
## Writing Rules
- British English spelling (traveller, colour, recognise, etc.)
- Practical, actionable content — readers want real information
${brand.internalLinkingRule}
- Do NOT invent specific statistics, prices (unless they match what's in the site context), or policy names
- Content must be substantive: ${wordRange} of HTML body content
- Use proper HTML: <h2>, <h3>, <p>, <ul>/<li>, <strong>, <a href="..."> tags
${brand.linkFormatRule}
${format ? "" : "- External links: DO NOT add external links — internal only\n"}- The HTML content must NOT include <html>, <head>, <body>, or <title> tags — just body content starting with an introductory <p>
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
${brand.ctaRules}`;

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
  "ctaBlock": "Self-contained HTML callout starting with <div class=\\"${brand.ctaClass}\\">, matching the CTA Block rules in the system prompt.",
  "faqs": [
${faqExamples}
  ],
  "tags": ["tag name 1", "tag name 2", "tag name 3"]
}

All values must be strings or arrays of strings/objects as shown. The "content" and "ctaBlock" fields must each be a single string of HTML. The "faqs" field must be an array of exactly ${faqCount} objects each with "question" and "answer" string fields.`;

  if (DRY_RUN) {
    // Prints the exact prompt the model would receive, so a brand pack can be
    // reviewed without spending a generation or publishing anything.
    console.log("=== SYSTEM PROMPT ===");
    console.log(systemPrompt);
    console.log("=== USER PROMPT ===");
    console.log(userPrompt);
    process.exit(0);
  }

  console.log(`Generating content for: ${topic.title}`);

  // A revision starts from the rejected draft plus the fact-checker's verdict.
  let feedback = revision
    ? `\n\n## Revise the draft below\n\nA fact-checker read the official sources you cited and rejected this draft. Rewrite it, fixing every point listed. Keep everything that was fine, keep the same format and required links, and keep the article the same length.\n\n${buildRevisionBrief(revision.verification)}\n\n### The draft to revise\n\n${revision.previous.content}`
    : "";
  let lastValidationError;

  for (let round = 1; round <= 3; round++) {
    if (round > 1) {
      console.log(`\n↻ Retry ${round - 1}/2 — feeding the validation failure back to the model`);
    }

  let message;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      message = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        output_config: { format: { type: "json_schema", schema: POST_SCHEMA } },
        messages: [{ role: "user", content: userPrompt + feedback }],
      });
      break;
    } catch (err) {
      if (attempt === 3) throw err;
      console.warn(`⚠  Attempt ${attempt} failed (${err.message}) — retrying in ${attempt * 10}s...`);
      await new Promise((r) => setTimeout(r, attempt * 10_000));
    }
  }

  const gu = message.usage ?? {};
  console.log(`  tokens: ${gu.input_tokens ?? 0} in, ${gu.output_tokens ?? 0} out`);

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

  stripEmDashesFromPost(parsed);

  try {
    validateRequiredLinks(parsed, requiredLinks);
    validateContentQuality(parsed, lengthTier, brand, { minWords: format?.minWords });
    if (format) {
      parsed.__citations = validateCitations(parsed, brand, {
        minCitations: format.minCitations,
      });
    }
  } catch (err) {
    lastValidationError = err;
    feedback = `\n\n## Your previous attempt was rejected\n\nReason: ${err.message}\n\nWrite the article again, fixing exactly that. Everything else about the brief still applies.`;
    continue;
  }

  console.log("✓ Blog content generated");
  return parsed;
  }

  throw lastValidationError;
}

async function postDraft({ brand, api, token, topic, content, availableTags, status }) {
  const lowerAvailable = availableTags.map((t) => t.toLowerCase());
  const validatedTags = content.tags.filter((t) => {
    const isValid = lowerAvailable.includes(t.toLowerCase());
    if (!isValid)
      console.warn(`⚠ Tag "${t}" not found in available tags — skipping`);
    return isValid;
  });

  const coverImageBlob = await fetchCoverImage(topic.title, brand);

  const finalContent = `${content.content}\n${content.ctaBlock}`;
  console.log("✓ Appended ctaBlock to article body");

  const form = new FormData();
  form.append("title", topic.title);
  form.append("content", finalContent);
  form.append("excerpt", content.excerpt);
  form.append("quickAnswer", content.quickAnswer);
  form.append("metaTitle", content.metaTitle);
  form.append("metaDescription", content.metaDescription);
  form.append("status", status);
  form.append("faqs", JSON.stringify(content.faqs));
  form.append("coverImage", coverImageBlob, "cover-placeholder.jpg");

  for (const tag of validatedTags) {
    form.append("tags[]", tag);
  }

  const res = await fetch(`${api.BACKEND_URL}/api/blogs`, {
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
  console.log(`✓ Saved as ${status} — ID: ${blogId}, slug: ${slug}`);
  return body.data;
}

async function main() {
  const brand = await loadBrand(parseBrandArg(process.argv.slice(2)));
  const api = createApiClient(brand);

  console.log(`\n=== ${brand.name} Blog Draft Generator ===`);
  console.log(`Date (UAE): ${getTodayUAE()}\n`);

  const topic = getTodaysTopic(brand, parseDateArg(process.argv.slice(2)));
  console.log(`Topic: ${topic.title}`);

  // A dry run renders the prompt and exits, so it needs no credentials and
  // never touches the backend.
  if (DRY_RUN) {
    await generateBlogContent({
      brand,
      topic,
      siteContext: readFileSync(join(__dirname, brand.siteContextFile), "utf8"),
      publishedPosts: [],
      availableTags: ["Example Tag"],
    });
    return;
  }

  const token = await api.login();

  const alreadyExists = await api.checkTitleExists(token, topic.title);
  if (alreadyExists) {
    console.log(`⏭  Post "${topic.title}" already exists — skipping.`);
    return;
  }

  const [publishedPosts, availableTags] = await Promise.all([
    api.fetchPublishedPosts(token),
    api.fetchBlogTags(token),
  ]);
  console.log(
    `✓ Fetched ${publishedPosts.length} published posts, ${availableTags.length} tags`,
  );

  const siteContext = readFileSync(join(__dirname, brand.siteContextFile), "utf8");

  const draftCache = parseFlag(process.argv.slice(2), "draft-file");
  const reuse = draftCache && existsSync(draftCache);
  if (reuse) console.log(`Reusing saved draft: ${draftCache}`);

  let content = reuse
    ? JSON.parse(readFileSync(draftCache, "utf8"))
    : await generateBlogContent({
        brand,
        topic,
        siteContext,
        publishedPosts,
        availableTags,
      });

  if (draftCache && !reuse) {
    writeFileSync(draftCache, JSON.stringify(content, null, 2));
    console.log(`Saved draft to ${draftCache}`);
  }

  // Fact-check, then revise against the verdict and re-check. Without the
  // revise step the check can only ever block: a first draft routinely makes
  // claims that are true but absent from the pages it happened to cite.
  const MAX_REVISIONS = 2;
  let verification = null;

  if (content.__citations?.length) {
    console.log("\nFact-checking against the cited official sources...");
    verification = await verifyDraft({
      apiKey: ANTHROPIC_API_KEY,
      model: MODEL,
      title: topic.title,
      content: content.content,
      citations: content.__citations,
    });

    for (let round = 1; round <= MAX_REVISIONS && !isClean(verification); round++) {
      console.log(
        `\n↻ Revision ${round}/${MAX_REVISIONS} — ${verification.contradicted.length} contradicted, ${verification.unsupported.length} unsupported`,
      );
      content = await generateBlogContent({
        brand,
        topic,
        siteContext,
        publishedPosts,
        availableTags,
        revision: { previous: content, verification },
      });

      console.log("Re-checking the revised draft...");
      verification = await verifyDraft({
        apiKey: ANTHROPIC_API_KEY,
        model: MODEL,
        title: topic.title,
        content: content.content,
        citations: content.__citations ?? [],
      });
    }

    assertVerification(verification, { strict: true });
    console.log("✓ Every claim is supported by a cited official source");
  }

  const status = parseStatusArg(process.argv.slice(2));
  const draft = await postDraft({ brand, api, token, topic, content, availableTags, status });

  console.log(`\n✅ Done! Published "${draft?.title}" — now live.`);
  console.log(`   Live at: ${brand.blogUrl(draft?.slug)}`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
