/**
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
