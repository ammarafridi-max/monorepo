/**
 * Remove the brand from stored meta titles.
 *
 * The root layout sets `title.template = '%s | VisaWadi'`, which Next appends to
 * every nested page. Any title that already ends in the brand therefore renders
 * it twice:
 *
 *   "Canada Visa from UAE | TRV Visa Assistance | VisaWadi | VisaWadi"
 *
 * The template is the right pattern — one place owns the suffix — so the fix is
 * to stop the stored titles repeating it. Two shapes to deal with:
 *
 *   "… | VisaWadi"                 trailing brand, drop it
 *   "… | VisaWadi Visa Assistance" brand used as an adjective, drop just the word
 *
 * Worth knowing why the homepage looked fine: Next applies the template to child
 * segments only, and app/page.js shares a segment with app/layout.js. So `/` was
 * never templated and every nested page was.
 *
 * Applies to base visa pages and to residence overlays, since either can supply
 * the rendered title.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/fix-duplicate-brand-in-titles.mjs          # dry run
 *   node --env-file=.env.production scripts/fix-duplicate-brand-in-titles.mjs --apply
 */

import mongoose from 'mongoose';
import VisaSchema from '@travel-suite/visa/schema';
import VisaOverlaySchema from '@travel-suite/visa/overlay-schema';

const APPLY = process.argv.includes('--apply');
const BRAND = 'VisaWadi';

function stripBrand(title) {
  if (!title) return title;
  let out = title;
  // "… | VisaWadi Visa Assistance" -> "… | Visa Assistance"
  out = out.replace(new RegExp(`\\|\\s*${BRAND}\\s+(?=\\S)`, 'g'), '| ');
  // trailing "| VisaWadi" or "- VisaWadi"
  out = out.replace(new RegExp(`\\s*[|\\-—]\\s*${BRAND}\\s*$`), '');
  return out.replace(/\s{2,}/g, ' ').trim();
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
const VisaOverlay = conn.model('visa-overlay', VisaOverlaySchema);

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

let changed = 0;
for (const [label, Model, key] of [['visa', Visa, 'slug'], ['overlay', VisaOverlay, 'visaSlug']]) {
  const docs = await Model.find({ metaTitle: { $exists: true, $ne: '' } }).lean();
  for (const d of docs) {
    const next = stripBrand(d.metaTitle);
    if (next === d.metaTitle) continue;
    changed++;
    const who = label === 'overlay' ? `${d.residence}/${d[key]}` : d[key];
    console.log(`  [${label}] ${who}`);
    console.log(`      - ${d.metaTitle}`);
    console.log(`      + ${next}   (renders as "${next} | ${BRAND}")`);
    if (APPLY) await Model.updateOne({ _id: d._id }, { $set: { metaTitle: next } });
  }
}

console.log(`\ntitles changed=${changed}`);
if (!APPLY) console.log('Nothing was written.');
await mongoose.disconnect();
