/**
 * The checker only shows its "we can help with this" link when the matched
 * rule carries a visaSlug. Saudi Arabia was seeded before the page existed, so
 * every Saudi result was a dead end. Greece now has its own page rather than
 * falling back to the generic Schengen one.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/link-checker-rules-to-pages.mjs          # dry run
 *   node --env-file=.env.production scripts/link-checker-rules-to-pages.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const LINKS = { SA: 'saudi-arabia', GR: 'greece-visa' };

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
}
const rules = conn.db.collection('visa-rules');
const published = (await conn.db.collection('visas').find({ status: 'published' }).toArray()).map((v) => v.slug);

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

for (const [destination, visaSlug] of Object.entries(LINKS)) {
  if (!published.includes(visaSlug)) {
    console.log(`  ${destination}: "${visaSlug}" is not a published page, skipped`);
    continue;
  }
  const r = await rules.findOne({ destination });
  if (!r) {
    console.log(`  ${destination}: no rule, skipped`);
    continue;
  }
  console.log(`  ${destination} ${r.destinationName}: ${r.visaSlug ?? 'null'} -> ${visaSlug}`);
  if (APPLY) await rules.updateOne({ _id: r._id }, { $set: { visaSlug } });
}

console.log('\n=== destinations still without a link ===');
for (const r of await rules.find({ $or: [{ visaSlug: null }, { visaSlug: { $exists: false } }] }).toArray()) {
  console.log(`  ${r.destination} ${r.destinationName} (no page exists)`);
}

await mongoose.disconnect();
