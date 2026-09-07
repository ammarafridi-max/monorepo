// Usage: node --env-file=.env.development scripts/seo-wave2-fixes.mjs [--apply]
// Dry run by default. Pass --apply to write. Run from apps/dt365-backend.

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const AUTHOR_ID = '69cd18c27895514fa7e0fb6d';
const VERIFY_POST = 'dummy-ticket-not-verifiable-on-airline-website-heres-why';

const AUTHOR_PROFILE = {
  'authorProfile.slug': 'ammar-afridi',
  'authorProfile.sameAs': [
    'https://www.instagram.com/a.afridi56',
    'https://www.linkedin.com/in/ammar-afridi',
  ],
  'authorProfile.jobTitle': '',
  'authorProfile.bio': '',
  'authorProfile.credentials': [],
  'authorProfile.expertise': [],
  'authorProfile.avatarUrl': '',
};

// Every target verified present in blogs.slug before this list was written.
const HREF_MAP = {
  '../what-is-a-gds-system-and-why-it-matters-for-visa-applications':
    '/blog/what-is-a-gds-system-in-the-airline-industry',
  '../../../blog/what-is-a-gds-system-and-why-it-matters-for-visa-applications':
    '/blog/what-is-a-gds-system-in-the-airline-industry',
  '../why-free-dummy-tickets-are-dangerous-for-visa-applications':
    '/blog/why-free-dummy-tickets-are-dangerous-for-visa-applications',
  '../dummy-ticket-vs-refundable-ticket-which-is-safer-for-visa-applications':
    '/blog/dummy-ticket-vs-refundable-ticket-which-is-safer',
  '../../../blog/dummy-ticket-vs-refundable-ticket-which-is-safer-for-visa-applications':
    '/blog/dummy-ticket-vs-refundable-ticket-which-is-safer',
  '../dummy-ticket-not-verifiable-on-airline-website-heres-why':
    '/blog/dummy-ticket-not-verifiable-on-airline-website-heres-why',
  '../can-a-dummy-ticket-cause-visa-rejection':
    '/blog/can-a-dummy-ticket-cause-visa-rejection',
  '../../blog/what-happens-if-your-visa-dates-dont-match-your-flight-reservation':
    '/blog/visa-dates-dont-match-your-flight-reservation-read-this',
};

const NEW_FAQ_ANSWER =
  "A GDS is a centralized system like Amadeus, Sabre, or Travelport that holds reservations created through travel agents and third-party providers. Most airlines restrict their public booking portal to direct bookings, though some, including Emirates, Qatar Airways, Turkish Airlines, and Etihad, do display GDS and agency reservations. Embassies verify primarily through the GDS rather than the public portal, which is why a legitimate dummy ticket passes verification even when it does not appear on the airline's website.";

const NEW_QUICK_ANSWER =
  'Why is your dummy ticket not verifiable on the airline website? In most cases, it simply means the airline does not display third-party GDS reservations on its public portal. This is completely normal. Embassies verify primarily through GDS platforms like Amadeus, Sabre, and Travelport, where your reservation actually exists, rather than through the public pages travelers use.';

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
console.log(`mode: ${APPLY ? 'APPLY (writing)' : 'DRY RUN (no writes)'}  db: ${db.databaseName}\n`);

// ---- FIX 0b: author profile ----
const users = db.collection('admin-users');
const authorId = new mongoose.Types.ObjectId(AUTHOR_ID);
const authorBefore = await users.findOne({ _id: authorId }, { projection: { password: 0 } });
const slugConflicts = await users.countDocuments({
  'authorProfile.slug': AUTHOR_PROFILE['authorProfile.slug'],
  _id: { $ne: authorId },
});
console.log('== FIX 0b: authorProfile ==');
console.log('  target      :', authorBefore?.name);
console.log('  before      :', JSON.stringify(authorBefore?.authorProfile ?? '(field absent)'));
console.log('  after       :', JSON.stringify(AUTHOR_PROFILE));
console.log('  slug unique :', slugConflicts === 0 ? 'yes' : `NO (${slugConflicts} conflicts)`);
if (slugConflicts > 0) throw new Error('author slug is not unique, aborting');
if (APPLY) {
  const r = await users.updateOne(
    { _id: authorId },
    { $set: { ...AUTHOR_PROFILE, updatedAt: new Date() } },
  );
  console.log('  written     : matched', r.matchedCount, 'modified', r.modifiedCount);
}

// ---- FIX 1: broken hrefs ----
// updatedAt is deliberately preserved: these are href corrections, not content
// revisions, and bumping dateModified on 15 posts would be a false freshness signal.
const blogs = db.collection('blogs');
const all = await blogs.find({}).toArray();
console.log('\n== FIX 1: broken internal links ==');
let totalLinks = 0;
const plan = [];
for (const b of all) {
  let content = b.content || '';
  let n = 0;
  for (const [oldHref, newHref] of Object.entries(HREF_MAP)) {
    const re = new RegExp(`(<a\\s[^>]*href=")${escapeRe(oldHref)}(")`, 'gi');
    const hits = (content.match(re) || []).length;
    if (hits) {
      content = content.replace(re, `$1${newHref}$2`);
      n += hits;
    }
  }
  if (n) {
    plan.push({ slug: b.slug, n, content, _id: b._id, lenBefore: (b.content || '').length, lenAfter: content.length });
    totalLinks += n;
  }
}
for (const p of plan) console.log(`  ${String(p.n).padStart(2)} link(s)  ${p.slug}`);
console.log(`  posts: ${plan.length}  links rewritten: ${totalLinks}`);
if (APPLY) {
  for (const p of plan) {
    await blogs.updateOne({ _id: p._id }, { $set: { content: p.content } });
  }
  console.log('  written     :', plan.length, 'documents');
}

// ---- FIX 2: verification post FAQ + quick answer ----
const post = all.find((b) => b.slug === VERIFY_POST);
console.log('\n== FIX 2: FAQ #5 + quickAnswer ==');
console.log('  post        :', post.slug);
console.log('  faqs[4] Q   :', post.faqs[4].question);
console.log('  faqs[4] A   : (changed)', post.faqs[4].answer !== NEW_FAQ_ANSWER);
console.log('  quickAnswer : (changed)', post.quickAnswer !== NEW_QUICK_ANSWER);
if (APPLY) {
  const r = await blogs.updateOne(
    { _id: post._id },
    { $set: { 'faqs.4.answer': NEW_FAQ_ANSWER, quickAnswer: NEW_QUICK_ANSWER } },
  );
  console.log('  written     : matched', r.matchedCount, 'modified', r.modifiedCount);
}

// ---- verification ----
if (APPLY) {
  console.log('\n== POST-WRITE VERIFICATION (re-queried live) ==');
  const u = await users.findOne({ _id: authorId }, { projection: { password: 0 } });
  console.log('  authorProfile:', JSON.stringify(u.authorProfile));

  const fresh = await blogs.find({}).toArray();
  const slugSet = new Set(fresh.map((b) => b.slug));
  const STATIC = new Set(['/', '/dummy-ticket-australia-visa', '/dummy-ticket-canada-visa',
    '/dummy-ticket-japan-visa', '/dummy-ticket-schengen-visa', '/dummy-ticket-uk-visa',
    '/lufthansa-dummy-ticket', '/turkish-airlines-dummy-ticket', '/air-france-dummy-ticket',
    '/onward-ticket', '/flight-itinerary', '/blog', '/blog/tags', '/faq',
    '/terms-and-conditions', '/privacy-policy']);
  const tagSlugs = (await db.collection('blog-tags').find({}).toArray()).map((t) => '/blog/tags/' + t.slug);
  const routes = new Set([...STATIC, ...[...slugSet].map((s) => '/blog/' + s), ...tagSlugs]);
  let broken = 0, checked = 0;
  for (const b of fresh) {
    for (const m of (b.content || '').matchAll(/<a\s[^>]*href="([^"]+)"/gi)) {
      const h = m[1];
      if (/^https?:/i.test(h) && !h.includes('dummyticket365')) continue;
      if (/^(mailto|tel|#)/i.test(h)) continue;
      checked++;
      const r = new URL(h, 'https://x/blog/' + b.slug).pathname.replace(/\/$/, '') || '/';
      if (!routes.has(r)) { broken++; console.log('  STILL BROKEN:', b.slug, '->', h, '=>', r); }
    }
  }
  console.log(`  internal links checked: ${checked}  still broken: ${broken}`);

  const p2 = fresh.find((b) => b.slug === VERIFY_POST);
  console.log('  faqs[4].answer matches intended :', p2.faqs[4].answer === NEW_FAQ_ANSWER);
  console.log('  quickAnswer matches intended    :', p2.quickAnswer === NEW_QUICK_ANSWER);
  console.log('  FAQ text duplicated in body HTML:', (p2.content || '').includes('only shows bookings made directly'));
}

await mongoose.disconnect();
