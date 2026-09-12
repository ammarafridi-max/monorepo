/**
 * Usage, from automations/:
 *   node scripts/validate-draft.mjs --target travl --slug <slug> --file <draft.json>
 *
 * Runs the same gate blog-generate applies to a model draft, against a draft
 * written by hand. Exit 0 means the file would have been posted as-is.
 */

import { readFileSync } from "node:fs";
import { loadTarget } from "../src/registry.mjs";
import { resolveFormat } from "../src/lib/formats.mjs";
import {
  LENGTH_TIERS,
  BANNED_WORDS,
  validateFieldLengths,
  validateRequiredLinks,
  validateContentQuality,
  validateCitations,
  verifyCitationUrls,
  validateParagraphs,
  stripHtmlToText,
  countWords,
} from "../src/lib/blog-utils.mjs";

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : null;
};

const targetKey = arg("target");
const slug = arg("slug");
const file = arg("file");
if (!targetKey || !slug || !file) {
  console.error("Usage: validate-draft.mjs --target <key> --slug <slug> --file <draft.json>");
  process.exit(2);
}

const brand = await loadTarget(targetKey, { job: "blog-generate" });
const topics = JSON.parse(readFileSync(`${brand.dir}/topics.json`, "utf8"));
const topic = topics.find((t) => t.slug === slug);
if (!topic) {
  console.error(`No topic with slug "${slug}" in ${targetKey}/topics.json`);
  process.exit(2);
}

const parsed = JSON.parse(readFileSync(file, "utf8"));
const lengthTier = LENGTH_TIERS[topic.length] ? topic.length : "medium";
const format = resolveFormat(brand, lengthTier);
const errors = [];
const check = (label, fn) => {
  try {
    fn();
    console.log(`✓ ${label}`);
  } catch (err) {
    errors.push(err.message);
    console.log(`✗ ${label}: ${err.message}`);
  }
};

for (const key of ["metaTitle", "metaDescription", "excerpt", "quickAnswer", "content", "ctaBlock", "faqs", "tags"]) {
  if (!parsed[key]) errors.push(`missing field: ${key}`);
}
if (errors.length) {
  for (const e of errors) console.log(`✗ ${e}`);
  process.exit(1);
}

const everything = JSON.stringify(parsed);
check("no em dashes anywhere", () => {
  const n = (everything.match(/—/g) || []).length;
  if (n) throw new Error(`${n} em dash(es) found`);
});
check("field lengths", () => validateFieldLengths(parsed));
check("required links", () => validateRequiredLinks(parsed, brand.getRequiredLinks(topic)));
check("content quality and links", () =>
  validateContentQuality(parsed, lengthTier, brand, { minWords: format?.minWords }),
);
let citations = [];
if (format) {
  check(`citations (min ${format.minCitations})`, () => {
    citations = validateCitations(parsed, brand, { minCitations: format.minCitations });
  });
  check("paragraph length", () => validateParagraphs(parsed));
}
check(`faq count (${format?.faqCount ?? 5})`, () => {
  const want = format?.faqCount ?? 5;
  if (!Array.isArray(parsed.faqs) || parsed.faqs.length !== want) {
    throw new Error(`have ${parsed.faqs?.length ?? 0}`);
  }
});
check("cta block class", () => {
  if (!parsed.ctaBlock.startsWith(`<div class="${brand.ctaClass}">`)) {
    throw new Error(`must start with <div class="${brand.ctaClass}">`);
  }
});
check("quickAnswer word count (40-70)", () => {
  const n = parsed.quickAnswer.trim().split(/\s+/).length;
  if (n < 40 || n > 70) throw new Error(`${n} words`);
});
check("meta title length (50-60)", () => {
  const n = parsed.metaTitle.length;
  if (n < 50 || n > 60) throw new Error(`${n} characters`);
});
check("meta description length (150-160)", () => {
  const n = parsed.metaDescription.length;
  if (n < 150 || n > 160) throw new Error(`${n} characters`);
});
check("body opens with <p>, not a heading", () => {
  if (!/^\s*<p[\s>]/i.test(parsed.content)) throw new Error("content must start with an introductory <p>");
});

const text = stripHtmlToText(parsed.content);
const banned = BANNED_WORDS.filter((w) => new RegExp(`\\b${w}\\b`, "i").test(text));
if (banned.length) console.log(`⚠ banned words: ${banned.join(", ")}`);
console.log(`  ${countWords(parsed.content)} words, ${citations.length} citation(s)`);

if (citations.length) {
  try {
    await verifyCitationUrls(citations);
  } catch (err) {
    errors.push(err.message);
    console.log(`✗ dead citations: ${err.message}`);
  }
}

if (errors.length) {
  console.log(`\n${errors.length} problem(s)`);
  process.exit(1);
}
console.log("\nDraft passes the automation's gate.");
