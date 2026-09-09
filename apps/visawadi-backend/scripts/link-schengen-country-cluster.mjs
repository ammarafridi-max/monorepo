/**
 * Cross-links the Schengen country guides so they form a cluster.
 *
 * relatedPosts on the post page is derived from tags, and all seven of these
 * resolve to "Schengen Visa", a 27-post pool, so they almost never surface each
 * other. The blog schema has no manual related-posts field, so the links go in
 * `content` behind a marker attribute, which makes the block idempotent and
 * removable with --remove.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/link-schengen-country-cluster.mjs           # dry run
 *   node --env-file=.env.production scripts/link-schengen-country-cluster.mjs --apply
 *   node --env-file=.env.production scripts/link-schengen-country-cluster.mjs --remove --apply
 *   ... add --only <slug> to act on one post
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const REMOVE = process.argv.includes('--remove');
const ONLY = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;

const MARKER = 'data-block="country-cluster"';

const COUNTRIES = [
  { country: 'France',      anchor: 'France visa from the UAE',      slug: 'france-visa-from-uae-application-process-documents-and-tips',      visa: 'france-visa' },
  { country: 'Germany',     anchor: 'Germany visa from the UAE',     slug: 'germany-visa-from-uae-step-by-step-application-guide',             visa: 'germany-visa' },
  { country: 'Italy',       anchor: 'Italy visa from the UAE',       slug: 'italy-visa-from-uae-requirements-and-application-process',         visa: 'italy-visa' },
  { country: 'Spain',       anchor: 'Spain visa through BLS',        slug: 'spain-visa-uae-bls-international-process',                         visa: 'spain-visa' },
  { country: 'Greece',      anchor: 'Greece visa from the UAE',      slug: 'greece-visa-from-uae-how-to-apply-and-what-to-expect',             visa: 'greece-visa' },
  { country: 'Netherlands', anchor: 'Netherlands visa from the UAE', slug: 'netherlands-visa-from-uae-documents-and-process-explained',        visa: null },
  { country: 'Switzerland', anchor: 'Switzerland visa from the UAE', slug: 'switzerland-visa-from-uae-requirements-for-schengen-applicants',   visa: null },
];

const block = (self) => {
  const siblings = COUNTRIES.filter((c) => c.slug !== self.slug)
    .map((c) => `<li><a href="/blog/${c.slug}">${c.anchor}</a></li>`)
    .join('\n');
  const money = self.visa
    ? `\n<p>Applying for the ${self.country} visa now? <a href="/uae/visa/${self.visa}">See what VisaWadi's ${self.country} packages cover</a>.</p>`
    : `\n<p>Applying now? <a href="/uae/visa/schengen">See what VisaWadi's Schengen packages cover</a>.</p>`;
  return `\n<div ${MARKER}>\n<h2>Schengen visa guides by country</h2>\n<p>The consular fee is the same everywhere, but the portal, the application centre and the balance you have to show are not. These are the country guides for UAE residents:</p>\n<ul>\n${siblings}\n</ul>${money}\n</div>`;
};

const strip = (html) => String(html).replace(new RegExp(`\\n?<div ${MARKER}>[\\s\\S]*?<\\/div>`, 'g'), '');

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') { await mongoose.disconnect(); throw new Error(`Expected visawadi, got "${conn.db.databaseName}"`); }
const blogs = conn.db.collection('blogs');

console.log(`=== ${REMOVE ? 'REMOVE' : 'ADD'} ${APPLY ? 'APPLY' : 'DRY RUN'} ===${ONLY ? `  (only ${ONLY})` : ''}`);
let n = 0;
for (const c of COUNTRIES) {
  if (ONLY && c.slug !== ONLY) continue;
  const b = await blogs.findOne({ slug: c.slug });
  if (!b) { console.log(`  ${c.country}: NOT FOUND`); continue; }
  const base = strip(b.content);
  const next = REMOVE ? base : base + block(c);
  const had = base !== String(b.content);
  if (next === String(b.content)) { console.log(`  ${c.country.padEnd(12)} unchanged`); continue; }
  n++;
  console.log(`  ${c.country.padEnd(12)} ${had ? 'replacing existing block' : REMOVE ? 'removing' : 'adding'}  ${c.visa ? '+ money page' : '+ schengen hub'}  (${String(next).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length} words)`);
  if (APPLY) await blogs.updateOne({ _id: b._id }, { $set: { content: next, updatedAt: new Date() } });
}
if (!REMOVE && !ONLY) {
  console.log('\n--- block as it will render on the France post ---');
  console.log(block(COUNTRIES[0]).replace(/<li>/g, '  - ').replace(/<\/?(ul|div|p|h2|li)[^>]*>/g, '').replace(/<a href="([^"]+)">([^<]+)<\/a>/g, '$2 [$1]').replace(/\n{2,}/g, '\n').trim());
}
console.log(`\n  posts ${REMOVE ? 'stripped' : 'updated'}: ${n}`);
console.log(APPLY ? '\napplied.' : '\nnothing written.');
await mongoose.disconnect();
