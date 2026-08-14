/**
 * Usage, from apps/travl-backend:
 *   node --env-file=.env.production scripts/remove-migrated-scheduled-posts.mjs          # dry run
 *   node --env-file=.env.production scripts/remove-migrated-scheduled-posts.mjs --apply
 *
 * --apply deletes the posts; it refuses unless each is still scheduled, never
 * published, and already present in the export file.
 */

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const EXPORT_FILE = path.join(process.cwd(), 'migration-output', 'travl-unpublished-export.json');

const SLUGS = [
  'what-is-a-dummy-ticket-and-when-do-you-need-one',
  'dummy-ticket-vs-real-flight-booking-which-one-does-your-visa-need',
  'are-dummy-tickets-legal-what-uae-visa-applicants-should-know',
];

if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI. Run with --env-file=.env.production');
  process.exit(1);
}

if (!fs.existsSync(EXPORT_FILE)) {
  console.error(`No backup at ${EXPORT_FILE}. Run export-posts-for-visawadi.mjs first.`);
  process.exit(1);
}
const backup = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf8'));
const missingBackup = SLUGS.filter((s) => !backup.some((b) => b.slug === s));
if (missingBackup.length) {
  console.error(`Not in the backup file: ${missingBackup.join(', ')}`);
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
if (db.databaseName !== 'travl') {
  await mongoose.disconnect();
  throw new Error(`Expected the travl database, got "${db.databaseName}"`);
}

const col = db.collection('blogs');
const docs = await col.find({ slug: { $in: SLUGS } }).toArray();

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');
for (const s of SLUGS) {
  const d = docs.find((x) => x.slug === s);
  if (!d) { console.log(`  ${s}: already gone`); continue; }
  if (d.status !== 'scheduled') {
    await mongoose.disconnect();
    throw new Error(`${s} is "${d.status}", not scheduled. Refusing to delete.`);
  }
  if (d.publishedAt) {
    await mongoose.disconnect();
    throw new Error(`${s} has a publishedAt date, so it was public at some point. Refusing.`);
  }
  console.log(`  ${s}: scheduled ${new Date(d.scheduledAt).toISOString().slice(0, 10)} -> ${APPLY ? 'deleting' : 'would delete'}`);
}

if (APPLY) {
  const res = await col.deleteMany({ slug: { $in: SLUGS }, status: 'scheduled', publishedAt: null });
  console.log(`\ndeleted: ${res.deletedCount}`);
  const left = await col.countDocuments();
  const sched = await col.countDocuments({ status: 'scheduled' });
  console.log(`travl now: ${left} posts, ${sched} still scheduled`);
  console.log(`A copy of each remains in ${path.relative(process.cwd(), EXPORT_FILE)} and in the visawadi database.`);
} else {
  console.log('\nNothing was deleted.');
}

await mongoose.disconnect();
