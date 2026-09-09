/**
 * Removes the "Travel Insurance" tag from the 17 posts carrying it.
 *
 * None of them is an insurance post. Every one is a visa guide that mentions
 * the EUR 30,000 cover requirement in passing, so the tag was grouping visa
 * content under a product VisaWadi does not sell and building topical authority
 * on the wrong subject.
 *
 * The tag record itself is left in place, so /blog/tags/travel-insurance stays
 * reachable but lists nothing. That is a deliberate hold, not an oversight:
 * deleting a tag is the owner's call.
 *
 * `tags` is an array of plain strings on the blog schema, so this is a $pull.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/untag-travel-insurance.mjs          # dry run
 *   node --env-file=.env.production scripts/untag-travel-insurance.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const TAG = 'Travel Insurance';

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') { await mongoose.disconnect(); throw new Error(`Expected visawadi, got "${conn.db.databaseName}"`); }
const blogs = conn.db.collection('blogs');

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

const hit = await blogs.find({ tags: TAG }).sort({ slug: 1 }).toArray();
let stranded = 0;
for (const b of hit) {
  const left = (b.tags || []).filter((t) => t !== TAG);
  if (!left.length) stranded++;
  console.log(`  ${b.slug.slice(0, 58).padEnd(58)} ${b.tags.length} -> ${left.length} tags${left.length ? '' : '  *** WOULD LEAVE UNTAGGED ***'}`);
}
console.log(`\n  posts affected: ${hit.length}`);
console.log(`  posts that would end up with no tags: ${stranded}`);

if (APPLY && !stranded) {
  const res = await blogs.updateMany({ tags: TAG }, { $pull: { tags: TAG } });
  console.log(`  modified: ${res.modifiedCount}`);
} else if (APPLY) {
  console.log('  refused: some posts would be left with no tags at all');
}

console.log('\n--- verification ---');
const left = await blogs.countDocuments({ tags: TAG });
console.log(`  posts still tagged "${TAG}": ${left}`);
const published = await blogs.find({ status: 'published' }).toArray();
const counts = {};
published.forEach((b) => (b.tags || []).forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
console.log('  tag counts now:', Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(', '));
console.log(`  untagged published posts: ${published.filter((b) => !(b.tags || []).length).length}`);
console.log(APPLY ? '\napplied.' : '\nnothing written.');
await mongoose.disconnect();
