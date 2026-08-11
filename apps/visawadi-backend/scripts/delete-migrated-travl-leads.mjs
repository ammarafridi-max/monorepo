/**
 * Delete the visa leads that came across from Travl.
 *
 * They were migrated here so the cleanup would not destroy a live enquiry, but
 * the decision afterwards was to delete them outright. This removes exactly the
 * 5 that came from Travl, matched by _id, and nothing else — any lead VisaWadi
 * captures on its own is untouched.
 *
 * The full records remain in two backup files:
 *   apps/travl-backend/migration-output/travl-visa-leads-export.json
 *   apps/travl-backend/migration-output/travl-visa-data-backup.json
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/delete-migrated-travl-leads.mjs          # dry run
 *   node --env-file=.env.production scripts/delete-migrated-travl-leads.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const SRC = path.join(process.cwd(), 'migration-output', 'travl-visa-leads-export.json');

if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI. Run with --env-file=.env.production');
  process.exit(1);
}
if (!fs.existsSync(SRC)) {
  console.error(`Backup not found at ${SRC}. Refusing to delete without it.`);
  process.exit(1);
}

const leads = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const ids = leads.map((l) => new mongoose.Types.ObjectId(String(l._id)));

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
if (db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${db.databaseName}"`);
}

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');
console.log(`  backup present, holding ${leads.length} leads`);

const col = db.collection('visa-leads');
const total = await col.countDocuments();
const matched = await col.countDocuments({ _id: { $in: ids } });
console.log(`  visa-leads in database: ${total}, of which ${matched} came from Travl`);
console.log(`  ${total - matched} VisaWadi-native lead(s) will be left alone`);

if (APPLY) {
  const res = await col.deleteMany({ _id: { $in: ids } });
  console.log(`\ndeleted ${res.deletedCount} | remaining: ${await col.countDocuments()}`);
} else {
  console.log(`\nwould delete ${matched}. Nothing was deleted.`);
}

await mongoose.disconnect();
