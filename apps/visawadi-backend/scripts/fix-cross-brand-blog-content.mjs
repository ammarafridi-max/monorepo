/**
 * The 35 posts migrated from Travl carry Travl's products, and the migration
 * renamed the brand in some sentences but not others. Live posts ended up
 * claiming VisaWadi sells AXA insurance and dummy tickets, and quoting Dummy
 * Ticket 365 in dirhams.
 *
 * Who owns what (owner's call, 2026-08-16):
 *   VisaWadi         visa assistance in the UAE, nothing else
 *   Travl            travel insurance (from AED 30) and travel itineraries.
 *                    Itineraries may be mentioned but NEVER linked.
 *   Dummy Ticket 365 flight reservations, aka flight itineraries, aka dummy
 *                    tickets. Priced USD 13 / 20 / 23 for 2 / 7 / 14 days
 *                    validity. Never priced in dirhams.
 *
 * Travl and Dummy Ticket 365 are therefore deliberate cross-brand exceptions
 * here. See apps/visawadi-frontend/CLAUDE.md.
 *
 * Sentences that credit one brand with another's product in a way no rule can
 * settle are left untouched and listed under review for a human.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/fix-cross-brand-blog-content.mjs                # dry run
 *   node --env-file=.env.production scripts/fix-cross-brand-blog-content.mjs --report=r.md
 *   node --env-file=.env.production scripts/fix-cross-brand-blog-content.mjs --apply
 */

import mongoose from 'mongoose';
import { writeFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const REPORT = process.argv.find((a) => a.startsWith('--report='))?.split('=')[1] ?? null;

const DT_BRAND = 'Dummy Ticket 365';
const DT_FROM_PRICE = 'USD 13';

const INSURANCE_RE = /\binsurance\b|\bAXA\b|\bpolicy\b|\bcoverage\b/i;
/** Dummy Ticket 365's product, under all three of its names. */
const DT_PRODUCT_RE = /dummy ticket|flight reservation|flight itinerar/i;
/** Travl's itinerary product, as opposed to the generic phrase "travel itinerary". */
const TRAVL_ITINERARY_RE = /itinerary generator|travel itinerary document|itinerary tool|day-by-day (?:travel )?itinerary/i;
/** "the VisaWadi FAQ page" — our own property, never rebrand. */
/** VisaWadi's own service. A sentence claiming both this and insurance needs splitting by hand. */
const VISA_SERVICE_RE = /visa assistance|visa application support|help(?:s)? (?:you )?(?:with )?your visa|handles? your (?:visa|application)/i;
const OWN_PROPERTY_RE = /VisaWadi(?:\.ae)?(?:'s|’s)?\s+(?:FAQ|blog|site|website|page|team)/i;
const COMPETITOR_RE = /\bmydummyticket\.ae\b/gi;
/** AED 49 only ever meant the dummy-ticket price. AED 30 is insurance, AED 90+ are embassy fees. */
const DT_AED_PRICE_RE = /\bAED\s*49\b/gi;

/**
 * One sentence sells two brands' products in one breath, so no rule settles
 * them. Hand-written, applied after the automated passes (which have already
 * turned AED 49 into USD 13, hence the price in the patterns below).
 */
const MANUAL_FIXES = [
  // Credits Travl with flight itineraries, which are Dummy Ticket 365's product.
  [
    /Travl offers both[^.]*?insurance from AED 30\.?/gi,
    'Dummy Ticket 365 issues flight itineraries from USD 13, and Travl covers the Schengen-compliant AXA insurance from AED 30.',
  ],
  // Credit VisaWadi with the visa work and Travl with the insurance. Phrase-level
  // so any surrounding link survives.
  // Both of these run "VisaWadi offers <visa link> and <insurance link>" across
  // two anchors, so the fix is the connective between them, not the sentence.
  [
    /<\/a>\s+and\s+(?=<a\s+href="https:\/\/www\.travl\.ae\/travel-insurance)/gi,
    '</a>, and Travl provides ',
  ],
  [
    /<\/a>\s+for UAE residents,\s+plus\s+(?=<a\s+href="https:\/\/www\.travl\.ae\/travel-insurance)/gi,
    '</a> for UAE residents, and Travl provides ',
  ],
];

const TRAVL_ITINERARY_HREF_RE = /travl\.ae\/travel-itinerary/i;
const KEEP_HREF_RE = /travl\.ae\/(?:travel-insurance|blog\/[a-z0-9-]+)/i;

const REPOINT = [
  [/href="\/visa\//gi, 'href="/uae/visa/'],
  [/https?:\/\/(?:www\.)?travl\.ae\/blog\/?(?=["'])/gi, 'https://www.visawadi.com/blog'],
  [/https?:\/\/(?:www\.)?travl\.ae\/faq\/?(?=["'])/gi, 'https://www.visawadi.com/faq'],
];

const strip = (h) => (h || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/** Split a block's inner HTML into sentences without cutting inside a tag. */
function splitSentences(html) {
  const parts = [];
  let depth = 0, buf = '';
  for (let i = 0; i < html.length; i++) {
    const c = html[i];
    buf += c;
    if (c === '<') depth++;
    else if (c === '>') depth = Math.max(0, depth - 1);
    else if (depth === 0 && /[.!?]/.test(c) && (html[i + 1] === undefined || /\s/.test(html[i + 1]))) {
      parts.push(buf); buf = '';
    }
  }
  if (buf.trim()) parts.push(buf);
  return parts;
}

/** Unwrap <a>…</a> whose href matches, keeping the anchor text. */
function unwrapLinks(html, hrefRe) {
  return html.replace(
    /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (whole, href, inner) => (hrefRe.test(href) ? inner : whole),
  );
}

/** Rebrand a brand name without touching URLs. */
function rebrand(html, to) {
  return html.replace(/VisaWadi(?:\.ae)?(?:'s|’s)?/g, (m, off, s) => {
    const before = s.slice(Math.max(0, off - 80), off);
    if (/https?:\/\/[^\s"'<>]*$/.test(before)) return m;      // inside a URL
    if (/href\s*=\s*["'][^"']*$/i.test(before)) return m;     // inside an href
    const possessive = /['’]s$/.test(m);
    return possessive ? `${to}'s` : to;
  });
}

function classify(sentenceHtml) {
  const text = strip(sentenceHtml);
  const hrefs = [...sentenceHtml.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  const travlHrefs = hrefs.filter((h) => /travl\.ae/i.test(h));

  const namesVisaWadi = /VisaWadi/i.test(text);
  const isOwnProperty = OWN_PROPERTY_RE.test(text);
  const dtProduct = DT_PRODUCT_RE.test(text);
  const insurance = INSURANCE_RE.test(text);
  const travlItinerary = TRAVL_ITINERARY_RE.test(text);

  // Claiming visa assistance AND insurance in one breath is the only case no
  // rule settles: the sentence has to be split, which is a human's job.
  if (namesVisaWadi && !isOwnProperty && insurance && VISA_SERVICE_RE.test(text)) return 'review';
  // "Travl offers both — flight itineraries from AED 49 and AXA insurance"
  if (/\bTravl\b/i.test(text) && dtProduct && !travlHrefs.some((h) => KEEP_HREF_RE.test(h)) && /offers?\s+both/i.test(text)) return 'review';

  // Insurance wins over a passing mention of a ticket: "insurance from VisaWadi,
  // and a reservation from Dummy Ticket 365" only misattributes the insurance.
  if (namesVisaWadi && !isOwnProperty && dtProduct && !insurance) return 'dt';
  if (namesVisaWadi && !isOwnProperty && (insurance || travlItinerary)) return 'travl';
  return 'keep';
}

function transformSentence(html, verdict, log) {
  let out = html;
  const before = out;

  if (verdict === 'dt') out = rebrand(out, DT_BRAND);
  if (verdict === 'travl') out = rebrand(out, 'Travl');

  if (out !== before) log.push({ kind: verdict === 'keep' ? 'edited' : verdict, text: strip(before), to: strip(out) });
  return out;
}

/**
 * Applied to whole documents, not sentences, so list items and FAQ answers are
 * covered too. AED 49 only ever meant the dummy-ticket price in this corpus,
 * verified across all 35 occurrences before this was made unconditional.
 */
function normalise(text, log, where) {
  let out = text || '';
  const competitors = (out.match(COMPETITOR_RE) || []).length;
  if (competitors) { out = out.replace(COMPETITOR_RE, DT_BRAND); log.push({ kind: 'competitor', text: `${where}: mydummyticket.ae → ${DT_BRAND} (${competitors})` }); }

  const prices = (out.match(DT_AED_PRICE_RE) || []).length;
  if (prices) { out = out.replace(DT_AED_PRICE_RE, DT_FROM_PRICE); log.push({ kind: 'price', text: `${where}: AED 49 → ${DT_FROM_PRICE} (${prices})` }); }

  for (const [re, to] of MANUAL_FIXES) {
    const next = out.replace(re, to);
    if (next !== out) log.push({ kind: 'manual-fix', text: `${where}: ${re.source.slice(0, 50)}…` });
    out = next;
  }

  const unlinked = unwrapLinks(out, TRAVL_ITINERARY_HREF_RE);
  if (unlinked !== out) { log.push({ kind: 'itinerary-unlinked', text: `${where}: removed travel-itinerary link` }); out = unlinked; }
  return out;
}

function processHtml(content, log) {
  const normalised = normalise(content, log, 'body');
  let out = normalised.replace(/class\s*=\s*(["'])travl-cta\1/gi, 'class=$1visawadi-cta$1');
  if (out !== normalised) log.push({ kind: 'cta-class', text: 'renamed travl-cta → visawadi-cta' });

  for (const [re, to] of REPOINT) {
    const next = out.replace(re, to);
    if (next !== out) log.push({ kind: 'repointed', text: `→ ${to}` });
    out = next;
  }

  out = out.replace(/<(p|li|h2|h3)>([\s\S]*?)<\/\1>/gi, (whole, tag, inner) => {
    const kept = splitSentences(inner).map((s) => {
      const verdict = classify(s);
      if (verdict === 'review') { log.push({ kind: 'review', text: strip(s) }); return s; }
      return transformSentence(s, verdict, log);
    });
    const joined = kept.join(' ').replace(/\s+/g, ' ').trim();
    return joined ? `<${tag}>${joined}</${tag}>` : '';
  });

  let prev;
  do { prev = out; out = out.replace(/<(ul|ol)>\s*<\/\1>/gi, ''); } while (out !== prev);
  return out.trim();
}

function processFaqs(faqs, log) {
  return (faqs || []).map((f) => {
    const answer = (f.answer || '')
      .split(/(?<=[.!?])\s+/)
      .map((s) => {
        const verdict = classify(s);
        if (verdict === 'review') { log.push({ kind: 'faq-review', text: s }); return s; }
        return transformSentence(s, verdict, log);
      })
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    return { ...f, answer: normalise(answer, log, 'faq') };
  });
}

if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI. Run with --env-file=.env.production');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
}
const blogs = conn.db.collection('blogs');

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

const posts = await blogs.find({}).toArray();
const totals = {};
const report = [];
let touched = 0;

for (const p of posts) {
  const log = [];
  const content = processHtml(p.content, log);
  const faqs = processFaqs(p.faqs, log);
  const changed = content !== (p.content || '') || JSON.stringify(faqs) !== JSON.stringify(p.faqs || []);
  if (!changed && !log.length) continue;
  if (changed) touched++;
  for (const l of log) totals[l.kind] = (totals[l.kind] || 0) + 1;

  console.log(`${p.slug}\n   ${Object.entries(log.reduce((a, l) => ({ ...a, [l.kind]: (a[l.kind] || 0) + 1 }), {})).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  report.push(`## ${p.title}\n\n\`${p.slug}\`\n\n` +
    log.map((l) => (l.to ? `- **${l.kind}**\n  - was: ${l.text}\n  - now: ${l.to}` : `- **${l.kind}**: ${l.text}`)).join('\n'));

  if (APPLY && changed) await blogs.updateOne({ _id: p._id }, { $set: { content, faqs, updatedAt: new Date() } });
}

console.log(`\n${'='.repeat(60)}\nposts changed: ${touched} / ${posts.length}`);
for (const [k, v] of Object.entries(totals).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(18)} ${v}`);
if (REPORT) { writeFileSync(REPORT, `# Cross-brand blog fix\n\n${report.join('\n\n')}\n`); console.log(`\n✓ Full report: ${REPORT}`); }
if (APPLY) console.log('\n✓ Applied');

await mongoose.disconnect();
