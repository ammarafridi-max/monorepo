/**
 * Drop the collections left behind by domains Travl no longer mounts.
 *
 * All of these are empty. The visa ones were emptied by purge-visa-data.mjs
 * after the brand split; affiliates and airlines are older leftovers from
 * domains that were removed earlier.
 *
 * NOT dropped, even though it is also empty:
 *   products — the payments domain still registers this model and /admin/products
 *   is a live page, so the collection is expected to fill up later.
 *
 * Safety: re-counts every collection immediately before dropping and refuses if
 * anything is non-empty, so a document written between the survey and the run
 * cannot be destroyed. Nothing here holds data, so there is no backup step; the
 * visa records were already dumped by purge-visa-data.mjs.
 *
 * Usage, from apps/travl-backend:
 *   node --env-file=.env.production scripts/drop-orphaned-collections.mjs          # dry run
 *   node --env-file=.env.production scripts/drop-orphaned-collections.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const DROP = [
  // visa assistance — moved to VisaWadi
  'visas',
  'visa-leads',
  'visa-applications',
  'applicants',
  'application-documents',
  'document-types',
  'checklist-templates',
  'users', // customer accounts existed only for the /apply magic-link flow
  // older removals
  'affiliates',
  'airlines',
];

if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI. Run with --env-file=.env.production');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
if (db.databaseName !== 'travl') {
  await mongoose.disconnect();
  throw new Error(`Expected the travl database, got "${db.databaseName}"`);
}

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));
const nonEmpty = [];
for (const name of DROP) {
  if (!existing.has(name)) continue;
  const n = await db.collection(name).countDocuments();
  if (n > 0) nonEmpty.push(`${name} (${n} docs)`);
}
if (nonEmpty.length) {
  await mongoose.disconnect();
  throw new Error(`Refusing — these are not empty: ${nonEmpty.join(', ')}`);
}

let dropped = 0;
let absent = 0;
for (const name of DROP) {
  if (!existing.has(name)) { absent++; console.log(`  ${name}: already gone`); continue; }
  if (APPLY) {
    await db.collection(name).drop();
    dropped++;
    console.log(`  ${name}: dropped`);
  } else {
    console.log(`  ${name}: would drop (empty)`);
  }
}

const left = (await db.listCollections().toArray()).map((c) => c.name).sort();
console.log(`\ndropped=${dropped} alreadyGone=${absent}`);
console.log(`collections remaining (${left.length}): ${left.join(', ')}`);
if (!APPLY) console.log('\nNothing was dropped.');

await mongoose.disconnect();
