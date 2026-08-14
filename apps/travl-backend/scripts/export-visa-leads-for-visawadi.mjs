/**
 * Usage, from apps/travl-backend:
 *   node --env-file=.env.production scripts/export-visa-leads-for-visawadi.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

const OUT = path.join(process.cwd(), 'migration-output', 'travl-visa-leads-export.json');

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

const leads = await db.collection('visa-leads').find({}).toArray();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(leads, null, 2));

console.log(`exported ${leads.length} visa leads (read only, travl untouched)`);
const byStatus = {};
for (const l of leads) byStatus[l.status || 'unknown'] = (byStatus[l.status || 'unknown'] || 0) + 1;
console.log(' ', JSON.stringify(byStatus));
console.log(`-> ${path.relative(process.cwd(), OUT)}`);

await mongoose.disconnect();
