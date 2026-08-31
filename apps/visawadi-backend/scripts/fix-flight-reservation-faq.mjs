/**
 * H4. The Schengen-family packages include the flight reservation, but the
 * flight FAQ told applicants they arrange it themselves. The packages are
 * correct, so the FAQ is what changes.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/fix-flight-reservation-faq.mjs          # dry run
 *   node --env-file=.env.production scripts/fix-flight-reservation-faq.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const OLD = 'We tell you exactly what format your embassy expects, though you arrange the reservation itself separately.';
const NEW = 'Your package includes the flight reservation, so we book it in the format your embassy expects and hand it over ready to submit.';

/**
 * Schengen-family only. The UK, US and Canada packages offer guidance on the
 * reservation rather than the reservation itself, so the original wording is
 * accurate there and must stay.
 */
const SLUGS = ['schengen', 'france-visa', 'germany-visa', 'italy-visa', 'spain-visa', 'greece-visa'];

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
}

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

let changed = 0;
for (const coll of ['visas', 'visa-overlays']) {
  const c = conn.db.collection(coll);
  for (const d of await c.find({}).toArray()) {
    const slug = d.slug || d.visaSlug;
    if (!SLUGS.includes(slug)) continue;
    const faqs = d.faqs || [];
    let touched = false;
    const next = faqs.map((f) => {
      if (!f.answer?.includes(OLD)) return f;
      touched = true;
      return { ...f, answer: f.answer.replace(OLD, NEW) };
    });
    if (!touched) continue;
    changed++;
    console.log(`  ${coll} ${slug}`);
    if (APPLY) await c.updateOne({ _id: d._id }, { $set: { faqs: next } });
  }
}

console.log(`\n  ${changed} document(s) ${APPLY ? 'updated' : 'would change'}`);

const remaining = [];
for (const coll of ['visas', 'visa-overlays']) {
  for (const d of await conn.db.collection(coll).find({}).toArray()) {
    for (const f of d.faqs || []) {
      if (/arrange the reservation itself separately/i.test(f.answer || '')) {
        remaining.push(`${coll}/${d.slug || d.visaSlug}`);
      }
    }
  }
}
console.log(`  remaining occurrences of the old clause: ${remaining.length ? remaining.join(', ') : 'none'}`);

await mongoose.disconnect();
