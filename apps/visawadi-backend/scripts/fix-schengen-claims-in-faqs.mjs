/**
 * The same Schengen corrections, in quickAnswer and faqs.
 *
 * verify-schengen-claims.mjs rewrote `content` only, which is the identical
 * mistake update-schengen-visa-fee.mjs made: these posts repeat their headline
 * claim in the quick answer and in an FAQ, and both ship inside FAQPage schema.
 * Six posts were left carrying a verified stamp above a claim the Visa Code
 * contradicts.
 *
 * Scope is deliberately narrow. China, South Korea and the UK also say
 * "working days", and for them that is correct: those are their own
 * authorities' service standards, not the Schengen deadline. Only claims
 * governed by Article 23 are touched.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/fix-schengen-claims-in-faqs.mjs          # dry run
 *   node --env-file=.env.production scripts/fix-schengen-claims-in-faqs.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const BANK = '/blog/schengen-visa-bank-statement-requirements-for-uae-residents';

const CALENDAR =
  'The consulate has 15 calendar days from the date your application is lodged, extendable to a maximum of 45 in individual cases needing further scrutiny';
const FUNDS =
  'There is no single Schengen figure: each member state sets its own, from EUR 45 a day for Germany to EUR 122.10 a day for Spain, which also applies a EUR 1,098.90 floor per person';

const EDITS = {
  'italy-visa-from-uae-requirements-and-application-process': [
    ['Processing typically takes 10 to 15 working days from your VFS appointment, but can be longer during busy periods.',
     `${CALENDAR}. Summer and the Christmas period push files towards the longer end.`],
  ],
  'germany-visa-from-uae-step-by-step-application-guide': [
    ['Processing typically takes 10 to 15 working days.', `${CALENDAR}.`],
    ['Processing typically takes 10 to 15 working days from the date VFS submits your application to the German consulate.',
     `${CALENDAR}, counted from the date the application is lodged rather than from your appointment booking.`],
  ],
  'france-visa-from-uae-application-process-documents-and-tips': [
    ['Processing typically takes 10 to 15 working days, but it can be longer during busy travel periods such as summer or school holidays.',
     `${CALENDAR}. Summer and school holidays push files towards the longer end.`],
  ],
  'how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide': [
    ['Most applications are processed within 15 working days.', 'Most decisions come within 15 calendar days of lodging.'],
  ],
  'schengen-visa-for-first-time-applicants-how-to-prove-strong-ties-to-the-uae': [
    ['There is no fixed minimum, but embassies commonly reference EUR 50 to EUR 100 per day of your stay as a guideline.',
     `${FUNDS}.`],
  ],
  'schengen-visa-documents-checklist-for-uae-residents': [
    ['Most consulates expect to see roughly EUR 50 to EUR 100 per day of your planned trip available, on top of your prepaid flights and accommodation.',
     `${FUNDS}. The bank statement guide lists them by country.`],
  ],
};

/** Correct as written: their own authority's service standard, not Article 23. */
const NOT_SCHENGEN = new Set([
  'china-visa-from-uae-tourist-visa-application-process',
  'south-korea-visa-from-uae-documents-and-application-tips',
  'uk-visa-from-uae-standard-visitor-visa-application-guide',
]);

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') { await mongoose.disconnect(); throw new Error(`Expected visawadi, got "${conn.db.databaseName}"`); }
const blogs = conn.db.collection('blogs');

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');
let hits = 0, missed = 0;

for (const [slug, pairs] of Object.entries(EDITS)) {
  const b = await blogs.findOne({ slug });
  if (!b) { console.log(`  ${slug}: NOT FOUND`); missed++; continue; }
  let quickAnswer = String(b.quickAnswer || '');
  let faqs = (b.faqs || []).map((f) => ({ ...f }));
  const before = quickAnswer + JSON.stringify(faqs);

  for (const [from, to] of pairs) {
    let done = false;
    if (quickAnswer.includes(from)) { quickAnswer = quickAnswer.replace(from, to); done = true; }
    for (const f of faqs) {
      if (String(f.answer).includes(from)) { f.answer = String(f.answer).replace(from, to); done = true; }
    }
    if (done) { hits++; console.log(`  ${slug}\n     ${from.slice(0, 76)}`); }
    else { missed++; console.log(`  ${slug}\n     MISS "${from.slice(0, 70)}"`); }
  }

  if (APPLY && before !== quickAnswer + JSON.stringify(faqs)) {
    await blogs.updateOne({ _id: b._id }, { $set: { quickAnswer, faqs, updatedAt: new Date() } });
  }
}

console.log(`\n  edits: ${hits} | misses: ${missed}`);
console.log('\n--- verification across content, quickAnswer and faqs ---');
const all = await blogs.find({ status: 'published' }).toArray();
const RE = /\d+ to \d+ working days|\d+ working days|EUR 50 to EUR 100|up to 60 days in exceptional|15 business days/g;
let bad = 0;
for (const p of all) {
  const fields = [p.content, p.quickAnswer, ...(p.faqs || []).map((f) => f.answer)];
  for (const v of fields) {
    for (const m of String(v || '').matchAll(RE)) {
      if (NOT_SCHENGEN.has(p.slug)) continue;
      bad++;
      console.log(`  REMAINING ${p.slug}: "${m[0]}"`);
    }
  }
}
console.log(`  Schengen posts still contradicting Article 23 or Annex 25: ${bad}`);
console.log(APPLY ? '\napplied.' : '\nnothing written.');
await mongoose.disconnect();
