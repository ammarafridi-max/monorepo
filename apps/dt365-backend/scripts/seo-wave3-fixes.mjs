// Usage: node --env-file=.env.development scripts/seo-wave3-fixes.mjs [--apply]
// Dry run by default. Pass --apply to write. Run from apps/dt365-backend.

import mongoose from 'mongoose';
import fs from 'node:fs';

const APPLY = process.argv.includes('--apply');
const AUTHOR_ID = '69cd18c27895514fa7e0fb6d';
const PNR = 'what-is-a-pnr-in-flight-reservations-and-how-does-it-work';

const AUTHOR_PROFILE = {
  'authorProfile.jobTitle': 'Marketing Executive',
  'authorProfile.bio':
    'Ammar Afridi has spent four years preparing travel and visa documentation for UAE residents, working on Schengen, UK, US and Canada files and handling more than 2,000 applications.\n\nMost of the problems he sees are avoidable: a reservation that expires before the consulate opens the file, a PNR that was never in a GDS, travel dates that do not match the rest of the application. He writes about what embassies, airlines and immigration officers actually check, in the order they check it.\n\nHe is based in Dubai and reviews the reservations Dummy Ticket 365 issues.',
  'authorProfile.credentials': [
    'Marketing Executive at Dummy Ticket 365, Dubai',
    'Four years preparing visa and travel documentation for UAE residents',
    'More than 2,000 visa applications handled',
    'Schengen, UK, US and Canada files, plus France, Germany, Italy and Spain individually',
  ],
  'authorProfile.expertise': [
    'Dummy tickets and flight reservations',
    'Proof of onward travel',
    'GDS and PNR verification',
    'Schengen visas',
    'UK visitor visas',
    'Visa refusals',
  ],
};

const PNR_TITLE = 'What Is a PNR? Meaning, Status and Format Explained';
const PNR_META =
  'PNR means Passenger Name Record, the six-character code behind every flight booking. What it contains, what PNR status means, and how embassies verify it.';

const PNR_SECTION = `<h2>What Does PNR Status Mean?</h2>
<p>PNR status is the code attached to each segment of your booking that says whether the seat is confirmed, waitlisted, or cancelled. On a flight reservation the most common status is HK, which means holding confirmed. A dummy ticket created through a GDS shows a confirmed status on every segment, which is what an embassy or an airline agent expects to see when they look the PNR up.</p>
<table>
<thead>
<tr>
<th>Status code</th>
<th>Meaning</th>
<th>What it tells you</th>
</tr>
</thead>
<tbody>
<tr>
<td>HK</td>
<td>Holding confirmed</td>
<td>The segment is confirmed and held in the airline system</td>
</tr>
<tr>
<td>RR</td>
<td>Reconfirmed</td>
<td>The booking has been reconfirmed with the airline</td>
</tr>
<tr>
<td>TK</td>
<td>Confirmed after a schedule change</td>
<td>Still confirmed, but the time or flight number changed</td>
</tr>
<tr>
<td>HL</td>
<td>Waitlisted</td>
<td>You are on the waiting list, not confirmed</td>
</tr>
<tr>
<td>UC</td>
<td>Unable to confirm</td>
<td>The request could not be confirmed and the waitlist is closed</td>
</tr>
<tr>
<td>HX</td>
<td>Cancelled</td>
<td>The segment has been cancelled</td>
</tr>
<tr>
<td>UN</td>
<td>Unable, flight not operating</td>
<td>The flight no longer runs on that date</td>
</tr>
</tbody>
</table>
<h3>Flight PNR Status Is Not the Same as Railway PNR Status</h3>
<p>Most searches for PNR status are about Indian Railways, which uses a different set of codes: CNF for confirmed, RAC for reservation against cancellation, and WL for waiting list. Airline bookings do not use those codes. If you are checking a flight reservation, the codes in the table above are the ones that apply.</p>
`;

// Each entry wraps existing anchor text in a link. `find` must match exactly once
// per post so a mis-targeted rewrite fails loudly instead of silently.
const LINKS = [
  { slug: 'what-documents-prove-onward-travel-to-immigration',
    find: 'Proof of onward travel shows immigration officers',
    anchor: 'Proof of onward travel', href: '/onward-ticket' },
  { slug: 'what-documents-prove-onward-travel-to-immigration',
    find: 'Japan and South Korea may request proof of onward travel',
    anchor: 'Japan', href: '/dummy-ticket-japan-visa' },
  { slug: 'can-you-use-a-dummy-ticket-at-airport-check-in',
    find: 'proof of onward travel beyond the transit point',
    anchor: 'proof of onward travel', href: '/onward-ticket' },
  { slug: 'can-you-use-a-dummy-ticket-for-visa-extensions',
    find: 'as proof of onward travel during the extension process',
    anchor: 'proof of onward travel', href: '/onward-ticket' },
  { slug: 'dummy-ticket-not-verifiable-on-airline-website-heres-why',
    find: 'Emirates, Qatar Airways, Turkish Airlines, Etihad',
    anchor: 'Turkish Airlines', href: '/turkish-airlines-dummy-ticket' },
  { slug: 'what-is-a-flight-itinerary-for-a-schengen-visa',
    find: 'Emirates, Turkish Airlines, and Lufthansa offer this',
    anchor: 'Turkish Airlines', href: '/turkish-airlines-dummy-ticket' },
  { slug: 'what-is-a-flight-itinerary-for-a-schengen-visa',
    find: 'and Lufthansa offer this on certain routes',
    anchor: 'Lufthansa', href: '/lufthansa-dummy-ticket' },
  { slug: 'should-you-buy-a-flight-ticket-before-visa-approval',
    find: 'UK, US, Canada, and Australia accept flight reservations',
    anchor: 'Canada', href: '/dummy-ticket-canada-visa' },
  { slug: 'should-you-buy-a-flight-ticket-before-visa-approval',
    find: 'and Australia accept flight reservations',
    anchor: 'Australia', href: '/dummy-ticket-australia-visa' },
  { slug: 'flight-reservation-expires-before-visa-approval-heres-what-to-do',
    find: 'Canada and Australia processing can stretch to months',
    anchor: 'Canada', href: '/dummy-ticket-canada-visa' },
  { slug: 'flight-reservation-expires-before-visa-approval-heres-what-to-do',
    find: 'and Australia processing can stretch to months',
    anchor: 'Australia', href: '/dummy-ticket-australia-visa' },
];

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const blogs = db.collection('blogs');
const users = db.collection('admin-users');
console.log(`mode: ${APPLY ? 'APPLY (writing)' : 'DRY RUN (no writes)'}  db: ${db.databaseName}\n`);

if (APPLY) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  fs.mkdirSync('backups', { recursive: true });
  const bp = `backups/blog-backup-${ts}.json`;
  const up = `backups/admin-users-backup-${ts}.json`;
  fs.writeFileSync(bp, JSON.stringify(await blogs.find({}).toArray(), null, 2));
  fs.writeFileSync(up, JSON.stringify(await users.find({}, { projection: { password: 0 } }).toArray(), null, 2));
  console.log('BACKUP:', bp);
  console.log('BACKUP:', up, '\n');
}

// ---- FIX 5: author profile ----
const authorId = new mongoose.Types.ObjectId(AUTHOR_ID);
const aBefore = await users.findOne({ _id: authorId }, { projection: { password: 0 } });
console.log('== FIX 5: author profile ==');
console.log('  jobTitle  :', JSON.stringify(aBefore.authorProfile.jobTitle), '->', JSON.stringify(AUTHOR_PROFILE['authorProfile.jobTitle']));
console.log('  bio       :', aBefore.authorProfile.bio.length, 'chars ->', AUTHOR_PROFILE['authorProfile.bio'].length, 'chars');
console.log('  creds     :', aBefore.authorProfile.credentials.length, '->', AUTHOR_PROFILE['authorProfile.credentials'].length);
console.log('  expertise :', aBefore.authorProfile.expertise.length, '->', AUTHOR_PROFILE['authorProfile.expertise'].length);
console.log('  avatarUrl : unchanged (skipped per owner)');
const crossBrand = JSON.stringify(AUTHOR_PROFILE).match(/visawadi/i);
console.log('  cross-brand leak check:', crossBrand ? 'FAIL ' + crossBrand[0] : 'clean');
if (crossBrand) throw new Error('cross-brand reference in author profile');
if (APPLY) {
  const r = await users.updateOne({ _id: authorId }, { $set: { ...AUTHOR_PROFILE, updatedAt: new Date() } });
  console.log('  written   : matched', r.matchedCount, 'modified', r.modifiedCount);
}

// ---- FIX 3: PNR title, meta, status section ----
const pnr = await blogs.findOne({ slug: PNR });
const anchorH2 = '<h2>Where to Find Your PNR Code</h2>';
const at = pnr.content.indexOf(anchorH2);
if (at < 0) throw new Error('PNR anchor heading not found');
const nextH2 = pnr.content.indexOf('<h2', at + anchorH2.length);
if (nextH2 < 0) throw new Error('no following h2 found');
const pnrContent = pnr.content.slice(0, nextH2) + PNR_SECTION + pnr.content.slice(nextH2);
console.log('\n== FIX 3: PNR post ==');
console.log('  title     :', JSON.stringify(pnr.title), `(${pnr.title.length})`);
console.log('           ->', JSON.stringify(PNR_TITLE), `(${PNR_TITLE.length})`);
console.log('  metaDesc  :', `(${pnr.metaDescription.length}) ->`, `(${PNR_META.length})`);
console.log('           ->', JSON.stringify(PNR_META));
console.log('  section inserted before:', pnr.content.slice(nextH2, nextH2 + 60).replace(/\n/g, ' '));
console.log('  content   :', pnr.content.length, '->', pnrContent.length, 'chars');
console.log('  new H2s   : What Does PNR Status Mean? (+ h3 railway note, 7-row status table)');
if (APPLY) {
  const r = await blogs.updateOne(
    { _id: pnr._id },
    { $set: { title: PNR_TITLE, metaTitle: PNR_TITLE, metaDescription: PNR_META, content: pnrContent } },
  );
  console.log('  written   : matched', r.matchedCount, 'modified', r.modifiedCount);
}

// ---- FIX 4: internal links to money pages ----
console.log('\n== FIX 4: internal links to money pages ==');
const byPost = new Map();
for (const L of LINKS) {
  if (!byPost.has(L.slug)) {
    const doc = await blogs.findOne({ slug: L.slug });
    byPost.set(L.slug, { _id: doc._id, content: doc.content });
  }
  const st = byPost.get(L.slug);
  const hits = st.content.split(L.find).length - 1;
  if (hits !== 1) throw new Error(`"${L.find}" matched ${hits}x in ${L.slug}`);
  const replaced = L.find.replace(L.anchor, `<a href="${L.href}">${L.anchor}</a>`);
  if (replaced === L.find) throw new Error(`anchor "${L.anchor}" not inside find string for ${L.slug}`);
  st.content = st.content.replace(L.find, replaced);
  console.log(`  ${L.slug.slice(0, 52).padEnd(52)} "${L.anchor}" -> ${L.href}`);
}
console.log(`  ${LINKS.length} links across ${byPost.size} posts`);
if (APPLY) {
  for (const [, st] of byPost) await blogs.updateOne({ _id: st._id }, { $set: { content: st.content } });
  console.log('  written   :', byPost.size, 'documents');
}

// ---- verification ----
if (APPLY) {
  console.log('\n== POST-WRITE VERIFICATION (re-queried live) ==');
  const u = await users.findOne({ _id: authorId }, { projection: { password: 0 } });
  console.log('  jobTitle:', u.authorProfile.jobTitle, '| creds:', u.authorProfile.credentials.length, '| expertise:', u.authorProfile.expertise.length, '| bio:', u.authorProfile.bio.length, 'chars');
  console.log('  bio mentions co-founder:', /co-?found/i.test(u.authorProfile.bio) || u.authorProfile.credentials.some((c) => /co-?found/i.test(c)));

  const p = await blogs.findOne({ slug: PNR });
  console.log('  PNR title  :', p.title);
  console.log('  PNR meta   :', p.metaDescription.length, 'chars');
  console.log('  status H2  :', p.content.includes('<h2>What Does PNR Status Mean?</h2>'));
  console.log('  status rows:', (p.content.match(/<td>(HK|RR|TK|HL|UC|HX|UN)<\/td>/g) || []).length);

  const fresh = await blogs.find({}).toArray();
  const slugs = new Set(fresh.map((b) => b.slug));
  const STATIC = new Set(['/', '/dummy-ticket-australia-visa', '/dummy-ticket-canada-visa',
    '/dummy-ticket-japan-visa', '/dummy-ticket-schengen-visa', '/dummy-ticket-uk-visa',
    '/lufthansa-dummy-ticket', '/turkish-airlines-dummy-ticket', '/air-france-dummy-ticket',
    '/onward-ticket', '/flight-itinerary', '/blog', '/blog/tags', '/faq',
    '/terms-and-conditions', '/privacy-policy']);
  const tagSlugs = (await db.collection('blog-tags').find({}).toArray()).map((t) => '/blog/tags/' + t.slug);
  const routes = new Set([...STATIC, ...[...slugs].map((s) => '/blog/' + s), ...tagSlugs]);
  const inbound = {};
  let broken = 0, checked = 0;
  for (const b of fresh) {
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
  console.log(`  internal links checked: ${checked}  broken: ${broken}`);
  console.log('  money-page inbound from blog content:');
  for (const p of ['/onward-ticket', '/dummy-ticket-japan-visa', '/dummy-ticket-australia-visa',
    '/dummy-ticket-canada-visa', '/lufthansa-dummy-ticket', '/turkish-airlines-dummy-ticket',
    '/air-france-dummy-ticket']) console.log(`    ${String(inbound[p] || 0).padStart(3)}  ${p}`);
}

await mongoose.disconnect();
