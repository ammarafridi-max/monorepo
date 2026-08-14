/**
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/rebrand-visa-pages.mjs          # dry run + diff
 *   node --env-file=.env.production scripts/rebrand-visa-pages.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import VisaSchema from '@travel-suite/visa/schema';

const APPLY = process.argv.includes('--apply');
const OUT = path.join(process.cwd(), 'migration-output', 'visa-pages-pre-rebrand.json');

const REWRITES = [
  [/Travl provides the flight reservation and hotel booking\./gi,
   'You will need a flight reservation and a hotel booking; we tell you exactly what format the embassy expects.'],
  [/We supply the flight reservation and the hotel booking\./gi,
   'You will need a flight reservation and a hotel booking; we tell you exactly what format the embassy expects.'],
  [/GDS flight reservation, which we provide and which Schengen embassies accept/gi,
   'Flight reservation in a format Schengen embassies accept'],

  [/\bTravl\b/g, 'VisaWadi'],
];

const SENSITIVE = new Set(['testimonials']);

function rewrite(value) {
  let out = value;
  for (const [re, to] of REWRITES) out = out.replace(re, to);
  return out;
}

function walk(value, pathStr, changes) {
  if (typeof value === 'string') {
    const next = rewrite(value);
    if (next !== value) changes.push({ path: pathStr, before: value, after: next });
    return next;
  }
  if (Array.isArray(value)) return value.map((v, i) => walk(v, `${pathStr}[${i}]`, changes));
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = walk(v, pathStr ? `${pathStr}.${k}` : k, changes);
    return out;
  }
  return value;
}

if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI. Run with --env-file=.env.production');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
}
const Visa = conn.model('Visa', VisaSchema);

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

const docs = await Visa.find({}).lean();
if (APPLY) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(docs, null, 2));
  console.log(`  backup -> ${path.relative(process.cwd(), OUT)}\n`);
}

const EDITABLE = ['metaTitle', 'metaDescription', 'heroHeadline', 'heroSubheadline', 'intro',
  'packages', 'requirementSections', 'processSteps', 'faqs', 'whyUs', 'pricingBreakdown',
  'testimonials', 'qualifiers', 'finalCtaHeadline', 'finalCtaText', 'excerpt'];

let touched = 0;
let totalChanges = 0;
const sensitiveChanges = [];

for (const doc of docs) {
  const changes = [];
  const update = {};
  for (const field of EDITABLE) {
    if (doc[field] === undefined) continue;
    const next = walk(doc[field], field, changes);
    if (JSON.stringify(next) !== JSON.stringify(doc[field])) update[field] = next;
  }
  if (!changes.length) continue;

  touched++;
  totalChanges += changes.length;
  console.log(`  ${doc.slug} — ${changes.length} change${changes.length === 1 ? '' : 's'}`);
  for (const c of changes) {
    const root = c.path.split(/[.[]/)[0];
    if (SENSITIVE.has(root)) sensitiveChanges.push({ slug: doc.slug, ...c });
    const before = c.before.length > 90 ? c.before.slice(0, 90) + '…' : c.before;
    const after = c.after.length > 90 ? c.after.slice(0, 90) + '…' : c.after;
    console.log(`      ${c.path}`);
    console.log(`        - ${before}`);
    console.log(`        + ${after}`);
  }

  if (APPLY) await Visa.updateOne({ _id: doc._id }, { $set: update });
}

console.log(`\npages touched=${touched} changes=${totalChanges}`);
if (sensitiveChanges.length) {
  console.log(`\n!! ${sensitiveChanges.length} of those are inside testimonials — a named customer's`);
  console.log('   quote now says VisaWadi where it said Travl. Review before leaving live.');
  for (const c of sensitiveChanges) console.log(`   ${c.slug}: ${c.after.slice(0, 100)}…`);
}
if (!APPLY) console.log('\nNothing was written.');

await mongoose.disconnect();
