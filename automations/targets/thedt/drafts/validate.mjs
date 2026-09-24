/**
 * Usage: node targets/thedt/drafts/validate.mjs
 *
 * Checks every hand-written draft against the same rules blog-generate would
 * apply: the target's contentChecks and forbiddenLinkPatterns, the format's
 * word and FAQ counts, the citation allowlist, and the required internal links
 * getRequiredLinks resolves for that title. Self-reported checks are not
 * evidence; this is.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import TARGET from '../config.mjs';
import { FORMATS } from '../../../src/lib/formats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const TIER_BY_SLUG = Object.fromEntries(
  JSON.parse(readFileSync(join(HERE, '..', 'topics.json'), 'utf8')).map((t) => [t.slug, t.length]),
);

const stripTags = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const words = (s) => stripTags(s).split(' ').filter(Boolean).length;

let failed = 0;

for (const file of readdirSync(HERE).filter((f) => f.endsWith('.json')).sort()) {
  const problems = [];
  const warn = [];
  const raw = readFileSync(join(HERE, file), 'utf8');

  let d;
  try {
    d = JSON.parse(raw);
  } catch (err) {
    console.log(`\n${file}\n  FAIL does not parse: ${err.message}`);
    failed++;
    continue;
  }

  const body = d.content ?? '';
  const text = stripTags(`${body} ${d.ctaBlock ?? ''} ${(d.faqs ?? []).map((f) => `${f.question} ${f.answer}`).join(' ')}`);
  const tier = TIER_BY_SLUG[d.slug];
  const format = FORMATS[TARGET.formatsByTier?.[tier]];

  if (!tier) problems.push(`slug "${d.slug}" is not in topics.json`);

  // Required fields
  for (const k of ['metaTitle', 'metaDescription', 'excerpt', 'quickAnswer', 'content', 'ctaBlock']) {
    if (typeof d[k] !== 'string' || !d[k].trim()) problems.push(`missing or empty: ${k}`);
  }

  // Lengths the CMS and the SERP care about
  const mt = (d.metaTitle ?? '').length;
  const md = (d.metaDescription ?? '').length;
  if (mt < 45 || mt > 65) warn.push(`metaTitle ${mt} chars (target 50-60)`);
  if (md < 140 || md > 165) warn.push(`metaDescription ${md} chars (target 150-160)`);

  // quickAnswer has a hard 500-char database limit
  const qa = d.quickAnswer ?? '';
  if (qa.length > 500) problems.push(`quickAnswer ${qa.length} chars, over the 500 database limit`);
  const qaWords = qa.split(/\s+/).filter(Boolean).length;
  if (qaWords < 35 || qaWords > 80) warn.push(`quickAnswer ${qaWords} words (target 40-70)`);

  if (format) {
    const w = words(body);
    if (w < format.minWords) problems.push(`content ${w} words, under the ${format.minWords} minimum for ${format.name}`);
    const faqs = d.faqs ?? [];
    if (faqs.length !== format.faqCount) problems.push(`${faqs.length} FAQs, expected ${format.faqCount}`);
    for (const [i, f] of faqs.entries()) {
      if (!f?.question || !f?.answer) problems.push(`FAQ ${i + 1} is missing a question or answer`);
    }
  }

  // Opens with a paragraph, not a heading
  if (!/^\s*<p[\s>]/i.test(body)) problems.push('content does not open with a <p>');

  // CTA shape
  if (!(d.ctaBlock ?? '').trim().startsWith(`<div class="${TARGET.ctaClass}"`)) {
    problems.push(`ctaBlock does not open with <div class="${TARGET.ctaClass}">`);
  }
  if (/<(script|style)\b/i.test(d.ctaBlock ?? '') || /style\s*=/i.test(d.ctaBlock ?? '')) {
    problems.push('ctaBlock contains a script, style tag or inline style');
  }

  // The target's own hard rules
  for (const check of TARGET.contentChecks ?? []) {
    const m = text.match(check.pattern);
    if (m) problems.push(`contentCheck: ${check.message} (matched "${m[0].slice(0, 70)}")`);
  }

  const allHrefs = [...body.matchAll(/href="([^"]+)"/g), ...(d.ctaBlock ?? '').matchAll(/href="([^"]+)"/g)]
    .map((m) => m[1]);

  for (const rule of TARGET.forbiddenLinkPatterns ?? []) {
    const hit = allHrefs.find((h) => rule.pattern.test(h)) ?? (rule.pattern.test(text) ? '(in body text)' : null);
    if (hit) problems.push(`forbidden link: ${rule.message} (${hit})`);
  }

  // Outbound links must be on the citation allowlist; internal ones on our own domain
  const external = allHrefs.filter((h) => /^https?:\/\//i.test(h) && !/thedummyticket\.ae/i.test(h));
  for (const url of external) {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const ok = (TARGET.citationDomains ?? []).some((d2) => host === d2 || host.endsWith(`.${d2}`));
    if (!ok) problems.push(`citation not on the allowlist: ${host}`);
  }
  if (format && new Set(external).size < format.minCitations) {
    problems.push(`${new Set(external).size} unique citations, needs ${format.minCitations}`);
  }

  // Required internal links for this exact title
  for (const link of TARGET.getRequiredLinks({ title: d.topic ?? '' })) {
    if (!allHrefs.some((h) => h.replace(/\/$/, '') === link.url.replace(/\/$/, ''))) {
      problems.push(`missing required internal link: ${link.url}`);
    }
  }

  // House style
  if (/[—–]/.test(text)) problems.push('contains an em or en dash');

  // Tags must exist on the site
  const KNOWN = ['Flight Reservations', 'Onward Travel', 'Schengen Visa', 'Travel Insurance', 'Entry Requirements', 'Visa Applications'];
  for (const t of d.tags ?? []) if (!KNOWN.includes(t)) problems.push(`unknown tag: ${t}`);
  if ((d.tags ?? []).length < 3) warn.push(`${(d.tags ?? []).length} tags (want 3-5)`);

  const status = problems.length ? 'FAIL' : 'ok  ';
  console.log(`\n${status} ${file}  ${words(body)} words, ${new Set(external).size} citations`);
  for (const p of problems) console.log(`       X ${p}`);
  for (const w of warn) console.log(`       ~ ${w}`);
  if (problems.length) failed++;
}

console.log(failed ? `\n${failed} draft(s) failed.` : '\nAll drafts pass.');
process.exit(failed ? 1 : 0);
