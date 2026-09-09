// Usage: node --env-file=.env.production scripts/seo-evisa-links.mjs [--apply]
//
// The eVisa post was the only published post with no contextual link to a money
// page. Adds three. Writes straight to the collection: the blog service
// regenerates slug and readingTime on save, which would churn published URLs.
// updatedAt is left alone so this does not read as a freshness signal.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes('--apply');
const SLUG = 'are-dummy-tickets-accepted-for-evisa-applications';
const A = (href, text) => `<a href="${href}">${text}</a>`;

const EDITS = [
  ['proof of onward travel is still required by most eVisa systems',
   `${A('/onward-ticket', 'proof of onward travel')} is still required by most eVisa systems`],
  ['Schengen applications still go through consulates and visa centres',
   `${A('/dummy-ticket-schengen-visa', 'Schengen applications')} still go through consulates and visa centres`],
  ['alongside travel insurance and hotel bookings',
   `alongside ${A('/travel-insurance', 'travel insurance')} and hotel bookings`],
];

await mongoose.connect(process.env.MONGO_URI);
const Blog = mongoose.connection.collection('blogs');
const post = await Blog.findOne({ slug: SLUG });
if (!post) { console.error(`post not found: ${SLUG}`); process.exit(1); }

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = join(__dirname, `seo-evisa-links-backup-${stamp}.json`);
writeFileSync(backup, JSON.stringify(post, null, 2));
console.log(`backed up -> ${backup}\n`);

const before = [...post.content.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
let c = post.content;
let failures = 0;

for (const [find, repl] of EDITS) {
  const hits = c.split(find).length - 1;
  if (hits !== 1) { console.error(`  EXPECTED 1 MATCH, GOT ${hits}: ${find.slice(0, 60)}`); failures++; continue; }
  c = c.replace(find, repl);
  console.log(`  + ${repl.match(/href="([^"]+)"/)[1]}`);
}

const after = [...c.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
const internal = after.filter((h) => h.startsWith('/'));
const dup = (arr) => new Set(arr.filter((h, i) => arr.indexOf(h) !== i));
const preExisting = dup(before.filter((h) => h.startsWith('/')));
const newDupes = [...dup(internal)].filter((h) => !preExisting.has(h));
if (newDupes.length) { console.error(`  NEW DUPLICATE TARGETS: ${newDupes.join(', ')}`); failures++; }

console.log(`\nlinks ${before.length} -> ${after.length}`);
if (failures) { console.error(`\n${failures} failure(s), nothing written.`); await mongoose.disconnect(); process.exit(1); }

if (!APPLY) {
  console.log('\nDRY RUN. Re-run with --apply to write.');
} else {
  await Blog.updateOne({ _id: post._id }, { $set: { content: c } });
  console.log('\napplied.');
}
await mongoose.disconnect();
