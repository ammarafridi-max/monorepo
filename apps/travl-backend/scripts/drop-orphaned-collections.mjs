/**
 * Usage, from apps/travl-backend:
 *   node --env-file=.env.production scripts/drop-orphaned-collections.mjs          # dry run
 *   node --env-file=.env.production scripts/drop-orphaned-collections.mjs --apply
 *
 * --apply drops collections irreversibly; it refuses if any of them is non-empty.
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const DROP = [
  'visas',
  'visa-leads',
  'visa-applications',
  'applicants',
  'application-documents',
  'document-types',
  'checklist-templates',
  'users',
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
