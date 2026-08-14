/**
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/neutralise-visa-bases.mjs          # dry run
 *   node --env-file=.env.production scripts/neutralise-visa-bases.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import VisaSchema from '@travel-suite/visa/schema';
import VisaOverlaySchema from '@travel-suite/visa/overlay-schema';

const APPLY = process.argv.includes('--apply');
const OUT = path.join(process.cwd(), 'migration-output', 'visa-bases-pre-neutralise.json');

const LOCAL = /Emirates ID|UAE Residence Visa|UAE residents?|\bUAE\b|Dubai|DAFZ|\bAED\b/i;

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
const VisaOverlay = conn.model('visa-overlay', VisaOverlaySchema);

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

const visas = await Visa.find({}).lean();
if (APPLY) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(visas, null, 2));
  console.log(`  backup -> ${path.relative(process.cwd(), OUT)}\n`);
}

function neutraliseText(s, countryName) {
  return s
    .replace(/\bfor UAE residents\b/gi, 'for applicants')
    .replace(/\bUAE residents\b/gi, 'Applicants')
    .replace(/\bfrom the UAE\b/gi, 'from your country of residence')
    .replace(/\bin the UAE\b/gi, 'in your country of residence')
    .replace(/\s*From AED\s*[\d,.]+\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const strip = (arr) => (arr || []).map(({ _id, ...rest }) => rest);

let touched = 0;
let noOverlay = 0;

for (const v of visas) {
  const overlay = await VisaOverlay.findOne({ residence: 'AE', visaSlug: v.slug });
  if (!overlay) {
    noOverlay++;
    console.log(`  ${v.slug}: SKIP — no UAE overlay, neutralising would lose the content`);
    continue;
  }

  const baseUpdate = {};
  const overlayUpdate = {};
  const notes = [];

  const whyUs = v.whyUs || [];
  const localWhyUs = whyUs.filter((w) => LOCAL.test(`${w.title} ${w.description || ''}`));
  if (localWhyUs.length) {
    if (!overlay.whyUs?.length) overlayUpdate.whyUs = strip(whyUs);
    baseUpdate.whyUs = strip(whyUs.filter((w) => !LOCAL.test(`${w.title} ${w.description || ''}`)));
    notes.push(`whyUs: ${localWhyUs.length} local entr${localWhyUs.length === 1 ? 'y' : 'ies'} → overlay`);
  }

  const faqs = v.faqs || [];
  const localFaqs = faqs.filter((f) => LOCAL.test(`${f.question} ${f.answer}`));
  if (localFaqs.length) {
    if (!overlay.faqs?.length) overlayUpdate.faqs = strip(faqs);
    baseUpdate.faqs = strip(faqs).map((f) =>
      LOCAL.test(`${f.question} ${f.answer}`)
        ? { question: neutraliseText(f.question, v.countryName), answer: neutraliseText(f.answer, v.countryName) }
        : f,
    );
    notes.push(`faqs: ${localFaqs.length} rewritten neutral in base, UAE originals → overlay`);
  }

  if (v.metaDescription && LOCAL.test(v.metaDescription)) {
    if (!overlay.metaDescription) overlayUpdate.metaDescription = v.metaDescription;
    baseUpdate.metaDescription = neutraliseText(v.metaDescription, v.countryName);
    notes.push('metaDescription → overlay, base neutralised');
  }

  if (v.metaTitle && LOCAL.test(v.metaTitle)) {
    if (!overlay.metaTitle) overlayUpdate.metaTitle = v.metaTitle;
    baseUpdate.metaTitle = neutraliseText(v.metaTitle, v.countryName);
    notes.push('metaTitle → overlay, base neutralised');
  }

  if (!notes.length) continue;
  touched++;
  console.log(`  ${v.slug}`);
  notes.forEach((n) => console.log(`      ${n}`));
  if (baseUpdate.metaDescription) {
    console.log(`      base desc now: ${baseUpdate.metaDescription.slice(0, 105)}`);
  }

  if (APPLY) {
    if (Object.keys(overlayUpdate).length) await VisaOverlay.updateOne({ _id: overlay._id }, { $set: overlayUpdate });
    if (Object.keys(baseUpdate).length) await Visa.updateOne({ _id: v._id }, { $set: baseUpdate });
  }
}

console.log(`\npages touched=${touched} skipped(no overlay)=${noOverlay}`);
if (!APPLY) console.log('\nNothing was written.');

await mongoose.disconnect();
