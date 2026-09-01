/**
 * 21 of 37 published posts had no link to a commercial visa page, so they
 * carried authority nowhere and gave the reader no next step.
 *
 * Appends one CTA paragraph, wrapped in a marker so it can be found and
 * removed again. Targets are mapped explicitly: keyword matching picked
 * "schengen" out of Vietnam and Malaysia posts because the word appears in
 * passing.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/add-blog-commercial-links.mjs           # dry run
 *   node --env-file=.env.production scripts/add-blog-commercial-links.mjs --apply
 *   node --env-file=.env.production scripts/add-blog-commercial-links.mjs --revert --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const REVERT = process.argv.includes('--revert');
const MARKER = 'data-cta="visa-page"';

/** slug -> [href, anchor sentence]. Destinations with no page point at the hub. */
const HUB = ['/uae', 'see the visas we handle from the UAE'];
const TARGETS = {
  'vietnam-visa-from-uae-e-visa-and-visa-on-arrival-guide': HUB,
  'malaysia-visa-from-uae-requirements-for-uae-residents': HUB,
  'india-visa-from-uae-e-visa-vs-sticker-visa-explained': HUB,
  'south-korea-visa-from-uae-documents-and-application-tips': HUB,
  'china-visa-from-uae-tourist-visa-application-process': HUB,
  'australia-visitor-visa-from-uae-subclass-600-explained': HUB,
  'uk-visa-from-uae-standard-visitor-visa-application-guide': ['/uae/visa/united-kingdom', 'see how our UK visa service works'],
  'greece-visa-from-uae-how-to-apply-and-what-to-expect': ['/uae/visa/greece-visa', 'see how our Greece visa service works'],
  'italy-visa-from-uae-requirements-and-application-process': ['/uae/visa/italy-visa', 'see how our Italy visa service works'],
  'germany-visa-from-uae-step-by-step-application-guide': ['/uae/visa/germany-visa', 'see how our Germany visa service works'],
  'france-visa-from-uae-application-process-documents-and-tips': ['/uae/visa/france-visa', 'see how our France visa service works'],
  'switzerland-visa-from-uae-requirements-for-schengen-applicants': ['/uae/visa/schengen', 'see how our Schengen visa service works'],
  'netherlands-visa-from-uae-documents-and-process-explained': ['/uae/visa/schengen', 'see how our Schengen visa service works'],
  'schengen-visa-bank-statement-requirements-for-uae-residents': ['/uae/visa/schengen', 'see how our Schengen visa service works'],
  'proof-of-onward-travel-for-schengen-visa-why-dummy-tickets-work': ['/uae/visa/schengen', 'see what every Schengen package includes'],
  'proof-of-accommodation-for-schengen-visa-what-uae-applicants-need': ['/uae/visa/schengen', 'see what every Schengen package includes'],
  'bls-international-uae-schengen-visa-application-guide': ['/uae/visa/spain-visa', 'see how our Spain visa service works'],
  'vfs-global-dubai-booking-appointments-and-what-to-expect': ['/uae/visa/schengen', 'see how our Schengen visa service works'],
  'single-entry-vs-multiple-entry-schengen-visa-which-one-should-you-get': ['/uae/visa/schengen', 'see how our Schengen visa service works'],
  'pnr-codes-explained-what-they-are-and-how-visa-officers-verify-them': ['/uae/visa/schengen', 'see what every Schengen package includes'],
  'dummy-ticket-providers-compared-what-to-look-for-before-you-buy': ['/uae/visa/schengen', 'see what every Schengen package includes'],
};

const cta = (href, anchor) =>
  `<p ${MARKER}>Rather not handle this yourself? We prepare the whole file, check every document against current requirements and book the appointment. <a href="${href}">${anchor[0].toUpperCase()}${anchor.slice(1)}</a>.</p>`;

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
}
const blogs = conn.db.collection('blogs');

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

if (REVERT) {
  let n = 0;
  for (const b of await blogs.find({ content: { $regex: MARKER } }).toArray()) {
    const content = String(b.content).replace(new RegExp(`<p ${MARKER}>.*?</p>`, 'gs'), '');
    console.log(`  revert ${b.slug}`);
    n++;
    if (APPLY) await blogs.updateOne({ _id: b._id }, { $set: { content } });
  }
  console.log(`\n  ${n} post(s) reverted`);
  await mongoose.disconnect();
  process.exit(0);
}

const published = (await conn.db.collection('visas').find({ status: 'published' }).toArray()).map((v) => v.slug);
let n = 0;
for (const [slug, [href, anchor]] of Object.entries(TARGETS)) {
  const b = await blogs.findOne({ slug });
  if (!b) { console.log(`  ${slug}: post not found, skipped`); continue; }
  if (String(b.content).includes(MARKER)) { console.log(`  ${slug}: already has a CTA, skipped`); continue; }

  const target = href.replace('/uae/visa/', '');
  if (href.startsWith('/uae/visa/') && !published.includes(target)) {
    console.log(`  ${slug}: target "${target}" is not published, skipped`);
    continue;
  }
  console.log(`  ${slug.slice(0, 58).padEnd(60)} -> ${href}`);
  n++;
  if (APPLY) await blogs.updateOne({ _id: b._id }, { $set: { content: String(b.content) + cta(href, anchor) } });
}
console.log(`\n  ${n} post(s) ${APPLY ? 'updated' : 'would change'}`);

const stillOrphan = (await blogs.find({ status: 'published' }).toArray()).filter(
  (b) => !/href="[^"]*\/(?:uae\/)?visa\/[^"]*"/.test(String(b.content)) && !String(b.content).includes('href="/uae"'),
);
console.log(`  published posts still with no commercial link: ${stillOrphan.length}`);
for (const b of stillOrphan) console.log(`    ${b.slug}`);

await mongoose.disconnect();
