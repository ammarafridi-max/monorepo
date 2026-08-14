/**
 * Usage, from apps/travl-backend:
 *   node --env-file=.env.production scripts/export-posts-for-visawadi.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

const SLUGS = [
  'what-is-a-dummy-ticket-and-when-do-you-need-one',
  'dummy-ticket-vs-real-flight-booking-which-one-does-your-visa-need',
  'are-dummy-tickets-legal-what-uae-visa-applicants-should-know',
  'what-to-do-if-your-schengen-visa-is-delayed-past-your-travel-date',
  'dummy-ticket-providers-compared-what-to-look-for-before-you-buy',
];

const OUT = path.join(process.cwd(), 'migration-output', 'travl-unpublished-export.json');

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

const docs = await db.collection('blogs').find({ slug: { $in: SLUGS } }).toArray();
const missing = SLUGS.filter((s) => !docs.some((d) => d.slug === s));
if (missing.length) {
  await mongoose.disconnect();
  throw new Error(`Not found in travl: ${missing.join(', ')}`);
}

const incomplete = docs.filter((d) => !d.content || !d.coverImageUrl || !d.title);
if (incomplete.length) {
  await mongoose.disconnect();
  throw new Error(`Incomplete posts: ${incomplete.map((d) => d.slug).join(', ')}`);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(docs, null, 2));

console.log(`exported ${docs.length} posts (read only, travl untouched)`);
for (const d of docs) {
  const when = d.scheduledAt ? new Date(d.scheduledAt).toISOString().slice(0, 10) : '-';
  console.log(`  ${d.status.padEnd(9)} ${when.padEnd(11)} ${d.slug}`);
}
console.log(`-> ${path.relative(process.cwd(), OUT)}`);

await mongoose.disconnect();
