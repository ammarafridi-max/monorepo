/**
 * Three corrections flagged in the SEO audit.
 *
 *   1. "We have a high success rate on second applications" on the Schengen
 *      page. Unsourced, and it sits in an FAQ, so it ships inside FAQPage
 *      schema where an answer engine can quote it. Replaced with what we can
 *      actually stand behind. Present on both the base visa and its overlay;
 *      the overlay wins at render time, so both are rewritten.
 *   2. "VisaWadi.ae" anchor text in the BLS post. The domain is .com.
 *   3. Six overlay metaTitles push the rendered <title> past 60 characters once
 *      the " | VisaWadi" template is applied. Trimmed to keep the
 *      differentiating term (VIDEX, Annex A, Wafi) and lose the filler.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/fix-credibility-and-titles.mjs          # dry run
 *   node --env-file=.env.production scripts/fix-credibility-and-titles.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const SUFFIX = 11; // " | VisaWadi"

const CLAIM = 'We have a high success rate on second applications when the first was professionally reanalysed.';
const CLAIM_FIX = 'A refusal is not a bar to reapplying, and the grounds on your refusal notice tell us exactly what the next file has to answer.';

const TITLES = {
  'italy-visa': 'Italy Visa from UAE | VFS Booking and Documents',
  'france-visa': 'France Visa from UAE | France-Visas and VFS',
  'saudi-arabia': 'Saudi Tourist eVisa for UAE Residents',
  'spain-visa': 'Spain Visa from UAE | BLS Account and Annex A',
  'greece-visa': 'Greece Visa from UAE | VFS Wafi Booking',
  'germany-visa': 'Germany Visa from UAE | VIDEX and VFS Booking',
};

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') { await mongoose.disconnect(); throw new Error(`Expected visawadi, got "${conn.db.databaseName}"`); }
const db = conn.db;

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

console.log('\n--- 1. unsourced success-rate claim ---');
for (const coll of ['visas', 'visa-overlays']) {
  for (const v of await db.collection(coll).find({}).toArray()) {
    const faqs = (v.faqs || []).map((f) => ({ ...f }));
    const hit = faqs.find((f) => String(f.answer).includes(CLAIM));
    if (!hit) continue;
    hit.answer = String(hit.answer).replace(CLAIM, CLAIM_FIX);
    console.log(`  ${coll}/${v.slug || v.visaSlug}: rewritten`);
    if (APPLY) await db.collection(coll).updateOne({ _id: v._id }, { $set: { faqs } });
  }
}

console.log('\n--- 2. VisaWadi.ae artefact ---');
const blogs = db.collection('blogs');
for (const b of await blogs.find({ content: /isawadi\.ae/i }).toArray()) {
  const next = String(b.content).replace(/VisaWadi\.ae/g, 'VisaWadi');
  console.log(`  ${b.slug}: ${(String(b.content).match(/VisaWadi\.ae/g) || []).length} occurrence(s)`);
  if (APPLY) await blogs.updateOne({ _id: b._id }, { $set: { content: next, updatedAt: new Date() } });
}

console.log('\n--- 3. overlay metaTitles over 60 rendered ---');
for (const [slug, title] of Object.entries(TITLES)) {
  const o = await db.collection('visa-overlays').findOne({ visaSlug: slug });
  if (!o) { console.log(`  ${slug}: OVERLAY NOT FOUND`); continue; }
  const was = (o.metaTitle || '').length + SUFFIX;
  const now = title.length + SUFFIX;
  console.log(`  ${slug.padEnd(14)} ${was} -> ${now}${now > 60 ? '  *** STILL OVER ***' : ''}`);
  console.log(`     was: ${o.metaTitle}`);
  console.log(`     now: ${title}`);
  if (APPLY) await db.collection('visa-overlays').updateOne({ _id: o._id }, { $set: { metaTitle: title } });
}

console.log('\n--- verification ---');
let claims = 0, ae = 0, over = 0;
for (const coll of ['visas', 'visa-overlays']) {
  for (const v of await db.collection(coll).find({}).toArray()) if (/high success rate/i.test(JSON.stringify(v))) claims++;
}
for (const b of await blogs.find({}).toArray()) if (/isawadi\.ae/i.test(b.content)) ae++;
const base = Object.fromEntries((await db.collection('visas').find({}).toArray()).map((v) => [v.slug, v.metaTitle || '']));
for (const o of await db.collection('visa-overlays').find({}).toArray()) {
  if (((o.metaTitle || base[o.visaSlug] || '').length + SUFFIX) > 60) over++;
}
console.log(`  success-rate claims left: ${claims}\n  VisaWadi.ae left: ${ae}\n  titles over 60: ${over}`);
console.log(APPLY ? '\napplied.' : '\nnothing written.');
await mongoose.disconnect();
