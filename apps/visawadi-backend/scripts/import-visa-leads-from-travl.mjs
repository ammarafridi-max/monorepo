/**
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/import-visa-leads-from-travl.mjs          # dry run
 *   node --env-file=.env.production scripts/import-visa-leads-from-travl.mjs --apply
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
  console.error(`Export file not found: ${SRC}\n  Run the Travl-side export first.`);
  process.exit(1);
}

const leads = JSON.parse(fs.readFileSync(SRC, 'utf8'));

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
if (db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${db.databaseName}"`);
}

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');
console.log(`  ${leads.length} leads in the export\n`);

const col = db.collection('visa-leads');
let inserted = 0;
let skipped = 0;

for (const lead of leads) {
  const _id = new mongoose.Types.ObjectId(String(lead._id));
  if (await col.findOne({ _id })) {
    skipped++;
    console.log(`  ${lead.email}: already imported`);
    continue;
  }
  const doc = { ...lead, _id };
  delete doc.id;
  delete doc.__v;
  for (const d of ['createdAt', 'updatedAt', 'contactedAt']) if (doc[d]) doc[d] = new Date(doc[d]);
  if (Array.isArray(doc.notes)) {
    doc.notes = doc.notes.map((n) => ({ ...n, createdAt: n.createdAt ? new Date(n.createdAt) : undefined }));
  }
  if (APPLY) {
    await col.insertOne(doc);
    inserted++;
    console.log(`  ${lead.email} (${lead.status}): imported`);
  } else {
    console.log(`  ${lead.email} (${lead.status}): would import`);
  }
}

console.log(`\ninserted=${inserted} alreadyPresent=${skipped}`);
console.log('total visa-leads on visawadi:', await col.countDocuments());
if (!APPLY) console.log('Nothing was written.');

await mongoose.disconnect();
