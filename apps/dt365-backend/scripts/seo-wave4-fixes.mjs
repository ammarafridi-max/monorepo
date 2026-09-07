// Usage: node --env-file=.env.development scripts/seo-wave4-fixes.mjs [--apply]
// Dry run by default. Pass --apply to write. Run from apps/dt365-backend.

import mongoose from 'mongoose';
import fs from 'node:fs';

const APPLY = process.argv.includes('--apply');

// --- FIX 3b: tag metaTitles (bare tag names today, so the code fallback never fires)
const TAG_TITLES = {
  'dummy-ticket-guides': 'Dummy Ticket Guides and How-Tos | Dummy Ticket 365',
  'visa-application-tips': 'Visa Application Tips and Guides | Dummy Ticket 365',
  'embassy-and-immigration': 'Embassy and Immigration Guides | Dummy Ticket 365',
  'gds-and-airline-systems': 'GDS and Airline Systems Explained | Dummy Ticket 365',
  'flight-reservations-for-visa': 'Flight Reservations for Visa | Dummy Ticket 365',
};

// --- FIX 5 step 2: replace a bare brand anchor with a descriptive one.
// `find` must match exactly once per post.
const ANCHORS = [
  { slug: 'dummy-ticket-not-verifiable-on-airline-website-heres-why',
    find: 'Get your verifiable dummy ticket and submit your visa application with complete confidence.',
    repl: '<a href="/">Get your verifiable dummy ticket</a> and submit your visa application with complete confidence.' },
  { slug: 'what-happens-if-you-submit-a-fake-flight-ticket',
    find: 'Get your verifiable dummy ticket and submit your visa application with confidence.',
    repl: '<a href="/">Get your verifiable dummy ticket</a> and submit your visa application with confidence.' },
  { slug: 'what-is-a-pnr-in-flight-reservations-and-how-does-it-work',
    find: 'Get your verifiable dummy ticket and submit your visa application with a PNR that holds up under scrutiny.',
    repl: '<a href="/">Get your verifiable dummy ticket</a> and submit your visa application with a PNR that holds up under scrutiny.' },
  { slug: 'is-it-safe-to-share-passport-details-for-a-dummy-ticket',
    find: 'Get your verifiable dummy ticket and share your details with confidence.',
    repl: '<a href="/">Get your verifiable dummy ticket</a> and share your details with confidence.' },
  { slug: 'visa-dates-dont-match-your-flight-reservation-read-this',
    find: 'Get your verifiable dummy ticket and submit a file where every document tells the same story.',
    repl: '<a href="/">Get your verifiable dummy ticket</a> and submit a file where every document tells the same story.' },
  { slug: 'why-free-dummy-tickets-are-dangerous-for-visa-applications',
    find: 'Visit Dummy Ticket 365 and get your verifiable dummy ticket in minutes.',
    repl: 'Visit Dummy Ticket 365 and <a href="/">get your verifiable dummy ticket</a> in minutes.' },
  { slug: 'how-to-book-a-multi-city-dummy-ticket-for-a-visa',
    find: 'Book your multi-city dummy ticket, verify every segment before submitting',
    repl: '<a href="/">Book your multi-city dummy ticket</a>, verify every segment before submitting' },
  { slug: 'should-you-buy-a-flight-ticket-before-visa-approval',
    find: 'Get your dummy ticket, submit your application, and buy your real flight after approval',
    repl: '<a href="/">Get your dummy ticket</a>, submit your application, and buy your real flight after approval' },
  // The three below are the genuinely new money-page links.
  { slug: 'can-you-use-a-dummy-ticket-at-airport-check-in',
    find: 'If you need a verifiable dummy ticket delivered in minutes',
    repl: 'If you need a <a href="/onward-ticket">verifiable onward ticket delivered in minutes</a>' },
  { slug: 'flight-reservation-expires-before-visa-approval-heres-what-to-do',
    find: 'and keep your visa application moving without interruption.',
    repl: 'and keep your <a href="/dummy-ticket-schengen-visa">Schengen visa application</a> moving without interruption.' },
  { slug: 'can-you-use-a-dummy-ticket-for-work-visa-applications',
    find: 'arrives in your inbox in minutes, and can be reissued if processing takes longer than expected.',
    repl: 'arrives in your inbox in minutes, and can be reissued if processing takes longer than expected. Applying for a visitor visa instead? Start with our <a href="/dummy-ticket-uk-visa">dummy ticket for a UK visa</a>.' },
];

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const blogs = db.collection('blogs');
const tags = db.collection('blog-tags');
console.log(`mode: ${APPLY ? 'APPLY (writing)' : 'DRY RUN (no writes)'}  db: ${db.databaseName}\n`);

if (APPLY) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  fs.mkdirSync('backups', { recursive: true });
  for (const [name, col] of [['blog', blogs], ['blog-tags', tags]]) {
    const p = `backups/${name}-backup-${ts}.json`;
    fs.writeFileSync(p, JSON.stringify(await col.find({}).toArray(), null, 2));
    console.log('BACKUP:', p);
  }
  console.log();
}

// ---- FIX 3b ----
console.log('== FIX 3b: tag metaTitles ==');
for (const [slug, title] of Object.entries(TAG_TITLES)) {
  const t = await tags.findOne({ slug });
  if (!t) throw new Error(`tag not found: ${slug}`);
  console.log(`  ${slug}`);
  console.log(`    - ${JSON.stringify(t.metaTitle)} (${(t.metaTitle || '').length})`);
  console.log(`    + ${JSON.stringify(title)} (${title.length})`);
  if (title.length > 60) throw new Error(`title too long: ${slug}`);
  if (/\bDT365\b/.test(title)) throw new Error(`informal brand short form in: ${slug}`);
  if (APPLY) await tags.updateOne({ _id: t._id }, { $set: { metaTitle: title } });
}
if (APPLY) console.log(`  written: ${Object.keys(TAG_TITLES).length} tags`);

// ---- FIX 5 step 1: keep one brand link per post, unwrap the rest ----
console.log('\n== FIX 5 step 1: deduplicate brand anchors ==');
const BRAND = /<a\s[^>]*href="(?:\.\.\/\.\.\/|\.\.\/\.\.\/\.\.\/|\/)"[^>]*>(Dummy Ticket 365)<\/a>/gi;
const all = await blogs.find({}).toArray();
const edits = new Map();
let removed = 0;
for (const b of all) {
  const hits = [...(b.content || '').matchAll(BRAND)];
  if (hits.length <= 1) continue;
  let content = b.content;
  // Walk backwards so earlier indices stay valid; keep occurrence 0.
  for (let i = hits.length - 1; i >= 1; i--) {
    const h = hits[i];
    content = content.slice(0, h.index) + h[1] + content.slice(h.index + h[0].length);
    removed++;
  }
  edits.set(b.slug, { _id: b._id, content });
  console.log(`  ${b.slug.slice(0, 58).padEnd(58)} ${hits.length} -> 1  (unwrapped ${hits.length - 1})`);
}
console.log(`  posts: ${edits.size}  brand links removed: ${removed}`);

// ---- FIX 5 step 2: descriptive anchors ----
console.log('\n== FIX 5 step 2: descriptive anchors ==');
for (const A of ANCHORS) {
  const base = edits.get(A.slug) || (() => {
    const d = all.find((x) => x.slug === A.slug);
    const st = { _id: d._id, content: d.content };
    edits.set(A.slug, st);
    return st;
  })();
  const n = base.content.split(A.find).length - 1;
  if (n !== 1) throw new Error(`"${A.find.slice(0, 50)}" matched ${n}x in ${A.slug}`);
  base.content = base.content.replace(A.find, A.repl);
  const href = A.repl.match(/href="([^"]+)"/)[1];
  const anchor = A.repl.match(/>([^<]+)<\/a>/)[1];
  console.log(`  ${A.slug.slice(0, 50).padEnd(50)} "${anchor}" -> ${href}`);
}
console.log(`  ${ANCHORS.length} anchors rewritten`);

if (APPLY) {
  for (const [, st] of edits) await blogs.updateOne({ _id: st._id }, { $set: { content: st.content } });
  console.log(`\n  written: ${edits.size} documents`);
}

// ---- verification ----
if (APPLY) {
  console.log('\n== POST-WRITE VERIFICATION (re-queried live) ==');
  const fresh = await blogs.find({}).toArray();
  const slugs = new Set(fresh.map((b) => b.slug));
  const STATIC = new Set(['/', '/dummy-ticket-australia-visa', '/dummy-ticket-canada-visa',
    '/dummy-ticket-japan-visa', '/dummy-ticket-schengen-visa', '/dummy-ticket-uk-visa',
    '/lufthansa-dummy-ticket', '/turkish-airlines-dummy-ticket', '/air-france-dummy-ticket',
    '/onward-ticket', '/flight-itinerary', '/blog', '/blog/tags', '/faq',
    '/terms-and-conditions', '/privacy-policy']);
  const tagSlugs = (await tags.find({}).toArray()).map((t) => '/blog/tags/' + t.slug);
  const routes = new Set([...STATIC, ...[...slugs].map((s) => '/blog/' + s), ...tagSlugs]);
  let broken = 0, checked = 0, brand = 0;
  const inbound = {};
  for (const b of fresh) {
    brand += [...(b.content || '').matchAll(BRAND)].length;
    for (const m of (b.content || '').matchAll(/<a\s[^>]*href="([^"]+)"/gi)) {
      const h = m[1];
      if (/^https?:/i.test(h) && !h.includes('dummyticket365')) continue;
      if (/^(mailto|tel|#)/i.test(h)) continue;
      checked++;
      const r = new URL(h, 'https://x/blog/' + b.slug).pathname.replace(/\/$/, '') || '/';
      if (!routes.has(r)) { broken++; console.log('  STILL BROKEN:', b.slug, '->', h); }
      inbound[r] = (inbound[r] || 0) + 1;
    }
  }
  console.log(`  internal links: ${checked}  broken: ${broken}  remaining bare brand anchors: ${brand}`);
  for (const p of ['/', '/onward-ticket', '/dummy-ticket-schengen-visa', '/dummy-ticket-uk-visa'])
    console.log(`    ${String(inbound[p] || 0).padStart(3)}  ${p}`);
  for (const [slug, title] of Object.entries(TAG_TITLES)) {
    const t = await tags.findOne({ slug });
    if (t.metaTitle !== title) console.log('  TAG MISMATCH:', slug);
  }
  console.log('  tag titles verified');
}

await mongoose.disconnect();
