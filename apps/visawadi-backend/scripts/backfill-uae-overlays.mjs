/**
 * Create the UAE residence overlay for every visa page.
 *
 * Today's visa documents ARE the UAE version — they were written for UAE
 * residents and carry AED prices, Emirates ID, VFS Dubai. This lifts the
 * country-specific half into an overlay so a second country becomes a small
 * file rather than a duplicated page.
 *
 * NON-DESTRUCTIVE. The base documents are not touched. The overlay holds a copy
 * of the UAE values, and since the overlay wins at render time, /uae/visa/x
 * looks identical to /visa/x does today. Nothing changes for a visitor.
 *
 * That leaves the base still UAE-flavoured, which matters only when a second
 * country arrives: a KSA overlay that forgets to override "Personal Documents"
 * would inherit Emirates ID. So the script reports exactly which base fields
 * still contain UAE-specific text — that report is the to-do list for
 * neutralising the base, which is a separate, riskier edit best done when the
 * routes exist and can be eyeballed.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/backfill-uae-overlays.mjs          # dry run
 *   node --env-file=.env.production scripts/backfill-uae-overlays.mjs --apply
 */

import mongoose from 'mongoose';
import VisaSchema from '@travel-suite/visa/schema';
import VisaOverlaySchema from '@travel-suite/visa/overlay-schema';

const APPLY = process.argv.includes('--apply');

const RESIDENCE = 'AE';
const RESIDENCE_NAME = 'United Arab Emirates';
const RESIDENCE_SLUG = 'uae';

/** Text that only makes sense for a UAE applicant. */
const UAE_MARKERS = /Emirates ID|UAE Residence Visa|UAE residence|VFS Global Dubai|Dubai|AED|BLS.*(Dubai|UAE)/i;

const VISA_CENTRES = {
  schengen:         { name: 'VFS Global', city: 'Dubai', note: 'Centre varies by destination country.' },
  'france-visa':    { name: 'VFS Global France', city: 'Dubai' },
  'germany-visa':   { name: 'VFS Global Germany', city: 'Dubai' },
  'italy-visa':     { name: 'VFS Global Italy', city: 'Dubai' },
  'spain-visa':     { name: 'BLS International Spain', city: 'Dubai' },
  'united-kingdom': { name: 'VFS Global UK', city: 'Dubai' },
  usa:              { name: 'US Consulate General', city: 'Dubai' },
  canada:           { name: 'VFS Global Canada', city: 'Dubai' },
};

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
console.log(`  ${visas.length} visa pages\n`);

const strip = (arr) => (arr || []).map(({ _id, ...rest }) => rest);

let created = 0;
let skipped = 0;
const baseStillLocal = [];

for (const v of visas) {
  const existing = await VisaOverlay.findOne({ residence: RESIDENCE, visaSlug: v.slug });
  if (existing) {
    skipped++;
    console.log(`  ${v.slug}: overlay exists, left alone`);
    continue;
  }

  // Only requirement sections that actually contain UAE-specific lines need an
  // override. A section of universal items stays shared, which is the whole
  // point — a second country inherits it instead of restating it.
  const localSections = (v.requirementSections || [])
    .filter((s) => (s.items || []).some((i) => UAE_MARKERS.test(i)))
    .map((s) => ({ title: s.title, items: s.items }));

  const overlay = {
    residence: RESIDENCE,
    residenceName: RESIDENCE_NAME,
    residenceSlug: RESIDENCE_SLUG,
    visaSlug: v.slug,
    packages: strip(v.packages),
    pricingBreakdown: strip(v.pricingBreakdown),
    testimonials: strip(v.testimonials),
    ...(localSections.length ? { requirementSections: localSections } : {}),
    ...(VISA_CENTRES[v.slug] ? { visaCentre: VISA_CENTRES[v.slug] } : {}),
    isPublished: v.status === 'published',
  };

  // Which base fields would leak UAE detail into another country later.
  const leaks = [];
  for (const [field, value] of Object.entries(v)) {
    if (['packages', 'pricingBreakdown', 'testimonials', 'requirementSections'].includes(field)) continue;
    if (UAE_MARKERS.test(JSON.stringify(value ?? ''))) leaks.push(field);
  }
  if (leaks.length) baseStillLocal.push({ slug: v.slug, fields: leaks });

  const bits = [
    `${overlay.packages.length} packages`,
    `${overlay.pricingBreakdown.length} fee rows`,
    `${overlay.testimonials.length} testimonials`,
    `${localSections.length} local requirement section${localSections.length === 1 ? '' : 's'}`,
  ].join(', ');

  if (APPLY) {
    await VisaOverlay.create(overlay);
    created++;
    console.log(`  ${v.slug}: overlay created — ${bits}`);
  } else {
    console.log(`  ${v.slug}: would create — ${bits}`);
  }
}

console.log(`\ncreated=${created} skipped=${skipped}`);

if (baseStillLocal.length) {
  console.log('\nBase documents still carrying UAE-specific text (the neutralise-later list):');
  for (const b of baseStillLocal) console.log(`  ${b.slug.padEnd(16)} ${b.fields.join(', ')}`);
  console.log('\n  Harmless today — the UAE overlay covers it. It matters the day a');
  console.log('  second country goes live without overriding these fields.');
}
if (!APPLY) console.log('\nNothing was written.');

await mongoose.disconnect();
