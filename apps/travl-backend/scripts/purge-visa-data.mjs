/**
 * Remove the leftover visa data from Travl after the split.
 *
 * Backs everything up to migration-output/travl-visa-data-backup.json first,
 * including the collections it does NOT touch, so the whole pre-purge state is
 * recoverable from one file.
 *
 * WHAT IT DELETES
 *   visa-applications, applicants, application-documents  (test records: every
 *     applicant has a blank name and no document reached Cloudinary)
 *   users            (one account, the owner's own address, created by testing
 *                     the /apply magic-link flow)
 *   visas            (all 9 already live on VisaWadi, and /visa now redirects)
 *   document-types   (checklist reference data, VisaWadi has its own)
 *
 * WHAT IT DELIBERATELY LEAVES ALONE
 *   visa-leads — these are NOT all test data. Real prospects are in there,
 *   including at least one with status "new" that nobody has contacted. Losing
 *   a live enquiry is not an acceptable side effect of a cleanup, so they stay
 *   until you decide whether to move them to VisaWadi.
 *
 * Usage, from apps/travl-backend:
 *   node --env-file=.env.production scripts/purge-visa-data.mjs          # dry run
 *   node --env-file=.env.production scripts/purge-visa-data.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const OUT = path.join(process.cwd(), 'migration-output', 'travl-visa-data-backup.json');

const PURGE = ['application-documents', 'applicants', 'visa-applications', 'users', 'visas', 'document-types'];
const KEEP = ['visa-leads'];

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

// Refuse if any application looks like a real customer file rather than a test.
const apps = await db.collection('visa-applications').find({}).toArray();
const applicants = await db.collection('applicants').find({}).toArray();
const named = applicants.filter((a) => (a.firstName || '').trim() || (a.lastName || '').trim());
if (named.length) {
  await mongoose.disconnect();
  throw new Error(`${named.length} applicant(s) have real names. These may be live customer files. Refusing.`);
}
const docs = await db.collection('application-documents').find({}).toArray();
const uploaded = docs.filter((d) => /cloudinary/i.test(d.url || d.secureUrl || ''));
if (uploaded.length) {
  await mongoose.disconnect();
  throw new Error(`${uploaded.length} document(s) were actually uploaded. Refusing until reviewed.`);
}
console.log(`  safety checks passed: ${apps.length} applications, all applicants unnamed, no uploaded documents`);

const dump = {};
for (const c of [...PURGE, ...KEEP]) dump[c] = await db.collection(c).find({}).toArray();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(dump, null, 2));
console.log(`  backup -> ${path.relative(process.cwd(), OUT)}`);
console.log('  ' + Object.entries(dump).map(([k, v]) => `${k}=${v.length}`).join('  '));

console.log('');
for (const c of PURGE) {
  const n = dump[c].length;
  if (!APPLY) { console.log(`  would delete ${String(n).padStart(3)} from ${c}`); continue; }
  const res = await db.collection(c).deleteMany({});
  console.log(`  deleted ${String(res.deletedCount).padStart(3)} from ${c}`);
}
for (const c of KEEP) console.log(`  KEPT ${String(dump[c].length).padStart(4)} in ${c} (real prospects — decide separately)`);

if (!APPLY) console.log('\nNothing was deleted.');
await mongoose.disconnect();
