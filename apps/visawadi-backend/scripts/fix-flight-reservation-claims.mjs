/**
 * Stop the visa pages claiming VisaWadi supplies flight reservations.
 *
 * The pages were imported from Travl, which did sell them. VisaWadi sells visa
 * assistance only — dummy tickets and flight reservations go to Dummy Ticket
 * 365 — so twenty places on the live site advertised something we don't do,
 * including a UK package listing a reservation as an included feature.
 *
 * Every replacement below is an exact string, not a pattern. Visa copy is
 * commercial and legal-adjacent; a loose regex rewriting it in bulk is how you
 * end up with a sentence that reads fine and says the wrong thing. Anything not
 * matched exactly is reported as a miss rather than silently skipped.
 *
 * The line taken throughout: the document is required, the embassy accepts this
 * format, we tell you what it needs to look like, you arrange it yourself.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/fix-flight-reservation-claims.mjs          # dry run
 *   node --env-file=.env.production scripts/fix-flight-reservation-claims.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import VisaSchema from '@travel-suite/visa/schema';

const APPLY = process.argv.includes('--apply');
const OUT = path.join(process.cwd(), 'migration-output', 'visa-pages-pre-flight-fix.json');

const GUIDANCE_TAIL =
  'We tell you exactly what format your embassy expects, though you arrange the reservation itself separately.';

/** [exact find, replace]. Applied to every string field on every visa page. */
const EDITS = [
  // --- requirement checklists: drop "(we provide this)" -----------------------
  ['Flight itinerary / reservation (we provide this — accepted by IRCC)',
   'Flight itinerary or reservation, in a format IRCC accepts'],
  ['GDS flight reservation / itinerary (we provide this — accepted by all Schengen embassies)',
   'Flight reservation or itinerary, in a format every Schengen embassy accepts'],
  ['Flight itinerary / reservation (we provide this — accepted by UK Home Office)',
   'Flight itinerary or reservation, in a format the UK Home Office accepts'],
  ['Flight itinerary (we provide this — accepted by US consular officers)',
   'Flight itinerary, in a format US consular officers accept'],

  // --- package features: these claimed the reservation was included -----------
  ['GDS flight reservation included',
   'Guidance on the flight reservation the Home Office expects'],
  ['Flight itinerary for your application',
   'Guidance on the flight itinerary your application needs'],
  ['Flight itinerary for the interview',
   'Guidance on the flight itinerary for your interview'],

  // --- process step: we do not prepare the itinerary --------------------------
  ['We prepare your supporting file: financial evidence, employment documents, cover letter, flight itinerary, and any additional documents specific to your profile.',
   'We prepare your supporting file: financial evidence, employment documents, cover letter, and any additional documents specific to your profile.'],

  // --- FAQ questions: "GDS" is a supplier term, not the applicant's ----------
  ['Will the France embassy accept a GDS flight reservation?', 'Will the France embassy accept a flight reservation?'],
  ['Will the Germany embassy accept a GDS flight reservation?', 'Will the Germany embassy accept a flight reservation?'],
  ['Will the Italy embassy accept a GDS flight reservation?', 'Will the Italy embassy accept a flight reservation?'],
  ['Will the Spain embassy accept a GDS flight reservation?', 'Will the Spain embassy accept a flight reservation?'],
  ['Is a GDS flight reservation accepted by Schengen embassies and VFS?', 'Is a flight reservation accepted by Schengen embassies and VFS?'],
  ['Is a GDS flight reservation accepted by the UK Home Office?', 'Is a flight reservation accepted by the UK Home Office?'],
  ['Is a GDS flight reservation accepted for a US visa interview?', 'Is a flight reservation accepted for a US visa interview?'],

  // --- FAQ answers: keep the useful fact, drop the provision claim ------------
  ["The reservations we provide are GDS-based and carry a real booking reference you can look up on the airline's own website.",
   `What matters is that it carries a real booking reference you can look up on the airline's own website. ${GUIDANCE_TAIL}`],
  ["VisaWadi's reservations are GDS-based, hold a real booking reference, and can be looked up on the airline's website — they are specifically designed and widely accepted for visa applications.",
   `What matters is that the reservation holds a real booking reference the embassy can look up on the airline's website. ${GUIDANCE_TAIL}`],
  ['Our GDS-based reservations carry a verifiable booking reference appropriate for IRCC submissions.',
   `What matters is that the reservation carries a verifiable booking reference. ${GUIDANCE_TAIL}`],
  ['Our GDS-based reservations carry a verifiable booking reference and are accepted for UK visa applications.',
   `What matters is that the reservation carries a verifiable booking reference. ${GUIDANCE_TAIL}`],
  ['Our GDS-based reservations carry a verifiable booking reference and are appropriate for US visa interviews.',
   `What matters is that the reservation carries a verifiable booking reference. ${GUIDANCE_TAIL}`],
];

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

const applied = new Map(EDITS.map(([find]) => [find, 0]));

function rewrite(str) {
  let out = str;
  for (const [find, replace] of EDITS) {
    if (out.includes(find)) {
      out = out.split(find).join(replace);
      applied.set(find, applied.get(find) + 1);
    }
  }
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

const FIELDS = ['packages', 'requirementSections', 'processSteps', 'faqs', 'whyUs',
  'pricingBreakdown', 'intro', 'heroSubheadline', 'excerpt'];

let touched = 0;
let total = 0;

for (const doc of docs) {
  const changes = [];
  const update = {};
  for (const f of FIELDS) {
    if (doc[f] === undefined) continue;
    const next = walk(doc[f], f, changes);
    if (JSON.stringify(next) !== JSON.stringify(doc[f])) update[f] = next;
  }
  if (!changes.length) continue;

  touched++;
  total += changes.length;
  console.log(`  ${doc.slug} — ${changes.length}`);
  for (const c of changes) {
    console.log(`      ${c.path}`);
    console.log(`        - ${c.before.slice(0, 105)}${c.before.length > 105 ? '…' : ''}`);
    console.log(`        + ${c.after.slice(0, 105)}${c.after.length > 105 ? '…' : ''}`);
  }
  if (APPLY) await Visa.updateOne({ _id: doc._id }, { $set: update });
}

console.log(`\npages touched=${touched} changes=${total}`);

// An exact-match rule that never fires means the copy moved on and the rule is
// stale — worth knowing rather than assuming full coverage.
const missed = [...applied.entries()].filter(([, n]) => n === 0).map(([f]) => f);
if (missed.length) {
  console.log(`\n${missed.length} rule(s) matched nothing:`);
  missed.forEach((m) => console.log(`  · ${m.slice(0, 95)}`));
}
if (!APPLY) console.log('\nNothing was written.');

await mongoose.disconnect();
