#!/usr/bin/env node
/**
 * travl-blog-fix.mjs — Travl blog link / freshness / duplicate-consolidation fixer.
 *
 * PHASE 1 default = DRY RUN. Writes NOTHING. Logs every change it *would* make.
 * Updated for the Phase-1 decisions (see travl-blog-fix-plan.md §Decisions).
 *
 * Modes:
 *   node travl-blog-fix.mjs                 # dry run, all posts (default)
 *   node travl-blog-fix.mjs --apply         # PHASE 2: actually PATCH (needs auth)
 *   node travl-blog-fix.mjs --apply --only=<slug>   # canary: one post
 *   node travl-blog-fix.mjs --include-citations     # OFF this run; kept for a later pass
 *
 * Auth for --apply: export TRAVL_COOKIE="<admin session cookie string>"
 *   (PATCH route is protect + restrictTo('admin','blog-manager'); no creds in this env.)
 *
 * Idempotent: re-running detects already-fixed links/counts and skips.
 *
 * NOT done by this script (manual / sequenced in Phase 2 — see plan):
 *   1. Fold why-you-need's unique content into the canonical post (you do this by hand,
 *      using travl-duplicate-merge-why-you-need.md) BEFORE the redirect goes live.
 *   2. Add repo 301s (proxy.js).
 *   3. Unpublish why-you-need (PATCH status:'draft') so it drops from sitemap + API.
 *   The why-you-need post itself is intentionally SKIPPED here (it is being retired).
 */

const BASE = process.env.TRAVL_API || 'https://api.travl.ae';
const COOKIE = process.env.TRAVL_COOKIE || '';
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const INCLUDE_CITATIONS = args.includes('--include-citations'); // OFF by decision
const ONLY = (args.find((a) => a.startsWith('--only=')) || '').split('=')[1] || null;
const DRY = !APPLY;

// The duplicate being retired — never edit its body (its content is merged manually).
const RETIRE_SLUG = 'why-you-need-travel-insurance-for-your-schengen-visa-application';
const CANONICAL_SLUG = 'why-travel-insurance-is-mandatory-for-a-schengen-visa-and-what-coverage-you-need';

// ----------------------------------------------------------------------------
// CHANGE SET (Phase 1 discovery + your decisions)
// ----------------------------------------------------------------------------

// 1) Broken/consolidation internal link repoints — exact string replacements,
//    both absolute and ../../../ relative forms.
const REPOINTS = [
  // (a) ...complete-2026-guide-2 (soft-404) -> ...complete-2026-guide
  ['https://www.travl.ae/blog/how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide-2',
   'https://www.travl.ae/blog/how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide'],
  ['../../../blog/how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide-2',
   '../../../blog/how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide'],
  // (b) ...minimum-coverage-explained-2 (soft-404) -> ...minimum-coverage-explained
  ['https://www.travl.ae/blog/schengen-visa-travel-insurance-requirements-minimum-coverage-explained-2',
   'https://www.travl.ae/blog/schengen-visa-travel-insurance-requirements-minimum-coverage-explained'],
  ['../../../blog/schengen-visa-travel-insurance-requirements-minimum-coverage-explained-2',
   '../../../blog/schengen-visa-travel-insurance-requirements-minimum-coverage-explained'],
  // (c) /flight-itinerary (hard 404) -> /travel-itinerary (Travl's own itinerary money page)
  ['../../../flight-itinerary', '../../../travel-itinerary'],
  // (d) DUPLICATE CONSOLIDATION: why-you-need -> canonical "mandatory" slug
  [`https://www.travl.ae/blog/${RETIRE_SLUG}`, `https://www.travl.ae/blog/${CANONICAL_SLUG}`],
  [`../../../blog/${RETIRE_SLUG}`, `../../../blog/${CANONICAL_SLUG}`],
];

// 2) Cross-brand external itinerary/flight-reservation links -> Travl /travel-itinerary.
//    Rule: itinerary/flight-reservation intent -> Travl /travel-itinerary;
//          dummy-ticket intent + existing dummyticket365.com links -> LEFT AS-IS (untouched).
//    Full 28-post sweep found exactly ONE non-DT365 external brand link: mydummyticket.ae.
//    REPLACE (href + visible brand name), do not add alongside.
const CROSS_BRAND_REPLACE = [
  [
    '<a href="https://www.mydummyticket.ae">order a flight itinerary from mydummyticket.ae</a>',
    '<a href="../../../travel-itinerary">order a flight itinerary from Travl</a>',
  ],
];

// 3) Schengen member-state count fix (26 -> 29). Only the canonical post says 26.
const COUNT_FIX = {
  [CANONICAL_SLUG]: [
    ['across 26 European countries', 'across 29 European countries'],
    ['all 26 Schengen member states', 'all 29 Schengen member states'],
  ],
};

// 4) Citations — OFF this run by decision. Flagged spots stay in the plan for a later pass.
const CITATION_URL = 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32009R0810';
const CITATION_ANCHOR = ' <a href="' + CITATION_URL + '" rel="nofollow noopener" target="_blank">(EU Visa Code, Article 15)</a>';
const CITATION_MARKER = 'CELEX:32009R0810';

// ----------------------------------------------------------------------------
// Transform
// ----------------------------------------------------------------------------
function insertCitation(html) {
  if (html.includes(CITATION_MARKER)) return html;
  const re = /(EUR\s?30[,.]?000[^.<]{0,80}?medical[^.<]{0,80}?)([.<])/i;
  if (!re.test(html)) return html;
  return html.replace(re, (_, pre, tail) => pre + CITATION_ANCHOR + tail);
}

function transform(post) {
  let c = post.content;
  const changes = [];

  for (const [from, to] of REPOINTS) {
    if (c.includes(from)) {
      const n = c.split(from).length - 1;
      c = c.split(from).join(to);
      const label = from.includes(RETIRE_SLUG) ? 'consolidate' : 'repoint';
      changes.push(`${label} x${n}: ${from}  ->  ${to}`);
    }
  }
  for (const [from, to] of CROSS_BRAND_REPLACE) {
    if (c.includes(from)) { c = c.split(from).join(to); changes.push(`cross-brand replace: mydummyticket.ae -> /travel-itinerary`); }
  }
  const cf = COUNT_FIX[post.slug];
  if (cf) for (const [from, to] of cf) {
    if (c.includes(from)) { c = c.split(from).join(to); changes.push(`count: "${from}" -> "${to}"`); }
  }
  if (INCLUDE_CITATIONS) {
    const before = c;
    c = insertCitation(c);
    if (c !== before) changes.push(`citation: EU Visa Code Art 15 (EUR-Lex)`);
  }
  return { content: c, changes };
}

// ----------------------------------------------------------------------------
// Runner
// ----------------------------------------------------------------------------
async function fetchAllPosts() {
  const res = await fetch(`${BASE}/api/blogs?status=published&limit=100&page=1`);
  if (!res.ok) throw new Error(`read failed: ${res.status}`);
  const json = await res.json();
  return json.data.blogs;
}

async function patchPost(id, content) {
  if (!COOKIE) throw new Error('TRAVL_COOKIE not set — cannot authenticate PATCH');
  const res = await fetch(`${BASE}/api/blogs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: COOKIE },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`PATCH ${id} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  const fs = await import('node:fs');
  console.log(`\n=== travl-blog-fix  [${DRY ? 'DRY RUN — no writes' : 'APPLY'}]${ONLY ? ' only=' + ONLY : ''}${INCLUDE_CITATIONS ? ' +citations' : ''} ===\n`);
  let posts = await fetchAllPosts();
  if (ONLY) posts = posts.filter((p) => p.slug === ONLY);

  const backupDir = 'travl-blog-backups';
  if (APPLY && !fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

  let changed = 0;
  const summary = { repoint: 0, consolidate: 0, crossbrand: 0, count: 0, citation: 0 };
  for (const post of posts) {
    if (post.slug === RETIRE_SLUG) {
      console.log(`\n• ${post.slug}  — SKIPPED (retiring; body merged manually, then unpublished)`);
      continue;
    }
    const { content, changes } = transform(post);
    if (content === post.content) continue;
    changed++;
    changes.forEach((ch) => {
      if (ch.startsWith('repoint')) summary.repoint++;
      else if (ch.startsWith('consolidate')) summary.consolidate++;
      else if (ch.startsWith('cross-brand')) summary.crossbrand++;
      else if (ch.startsWith('count')) summary.count++;
      else if (ch.startsWith('citation')) summary.citation++;
    });
    console.log(`\n• ${post.slug}  (id ${post._id})`);
    changes.forEach((ch) => console.log(`    - ${ch}`));
    if (APPLY) {
      fs.writeFileSync(`${backupDir}/${post._id}.json`, JSON.stringify({ id: post._id, slug: post.slug, content: post.content }, null, 2));
      await patchPost(post._id, content);
      console.log('    ✓ patched (updatedAt/dateModified bumped by server)');
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
  console.log(`\n=== ${DRY ? 'WOULD CHANGE' : 'CHANGED'} ${changed} post(s) ===`);
  console.log(`    repoint-groups:${summary.repoint}  consolidations:${summary.consolidate}  cross-brand:${summary.crossbrand}  count-fixes:${summary.count}  citations:${summary.citation}`);
  if (DRY) console.log('\n(dry run — Phase 2: merge manually, then --apply with TRAVL_COOKIE, canary first, then add 301s + unpublish why-you-need)');
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
