/**
 * Usage, from apps/travl-backend:
 *   node --env-file=.env.production scripts/purge-visa-data.mjs          # dry run
 *   node --env-file=.env.production scripts/purge-visa-data.mjs --apply
 *
 * --apply permanently deletes these collections; a full backup is written to
 * migration-output/travl-visa-data-backup.json first.
 */

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const OUT = path.join(process.cwd(), 'migration-output', 'travl-visa-data-backup.json');

const PURGE = ['application-documents', 'applicants', 'visa-applications', 'users', 'visas', 'document-types', 'visa-leads'];
const KEEP = [];

const VISAWADI_API = 'https://api.visawadi.com';

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

const leads = await db.collection('visa-leads').find({}, { projection: { _id: 1, email: 1 } }).toArray();
if (leads.length) {
  const res = await fetch(`${VISAWADI_API}/health`);
  if (!res.ok) {
    await mongoose.disconnect();
    throw new Error('Cannot reach VisaWadi to confirm the leads were migrated. Refusing.');
  }
  const { default: m } = await import('mongoose');
  const vw = await m.createConnection(process.env.VISAWADI_MONGO_URI || '', {}).asPromise().catch(() => null);
  if (!vw) {
    await mongoose.disconnect();
    throw new Error(
      `${leads.length} visa-leads present. Set VISAWADI_MONGO_URI so this script can confirm they were imported, ` +
      'or run import-visa-leads-from-travl.mjs first and re-run with the variable set.',
    );
  }
  const present = await vw.db.collection('visa-leads').countDocuments({ _id: { $in: leads.map((l) => l._id) } });
  await vw.close();
  if (present !== leads.length) {
    await mongoose.disconnect();
    throw new Error(`Only ${present}/${leads.length} leads found on VisaWadi. Refusing to delete.`);
  }
  console.log(`  all ${leads.length} visa-leads confirmed present on VisaWadi`);
}

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
