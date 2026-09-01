/**
 * The Standard (AED 599) and Concierge (AED 699) Schengen packages include the
 * VFS/BLS appointment fee. Basic does not. The pages listed it as excluded on
 * all three.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/fix-schengen-vfs-fee-included.mjs          # dry run
 *   node --env-file=.env.production scripts/fix-schengen-vfs-fee-included.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const SLUGS = ['schengen', 'france-visa', 'germany-visa', 'italy-visa', 'spain-visa', 'greece-visa'];
const INCLUDED_IN = ['Standard', 'Concierge'];

const centreFor = (slug) => (slug === 'spain-visa' ? 'BLS' : 'VFS');
/** Matches "VFS appointment fee (AED ~95) not included", "BLS ..." and the
 *  Concierge variants that drop the trailing "not included". */
const isCentreFeeLine = (s) => /\b(VFS|BLS)\b/i.test(s) && /appointment|service charge/i.test(s);

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
}

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

for (const coll of ['visas', 'visa-overlays']) {
  const c = conn.db.collection(coll);
  for (const d of await c.find({}).toArray()) {
    const slug = d.slug || d.visaSlug;
    if (!SLUGS.includes(slug)) continue;
    const centre = centreFor(slug);
    const feature = `${centre} appointment fee included`;
    let touched = false;

    const packages = (d.packages || []).map((p) => {
      if (!INCLUDED_IN.includes(p.name)) return p;
      const exclusions = (p.exclusions || []).filter((x) => !isCentreFeeLine(x));
      const features = (p.features || []).includes(feature)
        ? p.features
        : [...(p.features || []), feature];
      if (exclusions.length !== (p.exclusions || []).length || features.length !== (p.features || []).length) {
        touched = true;
      }
      return { ...p, exclusions, features };
    });

    const pricingBreakdown = (d.pricingBreakdown || []).map((r) => {
      if (!new RegExp(`\\b${centre}\\b`, 'i').test(r.item)) return r;
      const note = `Included in the Standard and Concierge packages. Payable on top of Basic only. Set by ${centre === 'BLS' ? 'BLS International' : 'VFS Global'} and can change without notice.`;
      if (r.note === note) return r;
      touched = true;
      return { ...r, note };
    });

    if (!touched) continue;
    console.log(`  ${coll}/${slug} (${centre})`);
    if (APPLY) await c.updateOne({ _id: d._id }, { $set: { packages, pricingBreakdown } });
  }
}

console.log('\n=== verification: centre-fee exclusions per package ===');
for (const d of await conn.db.collection('visas').find({ slug: { $in: SLUGS } }).sort({ slug: 1 }).toArray()) {
  for (const p of d.packages || []) {
    const excl = (p.exclusions || []).filter(isCentreFeeLine);
    const feat = (p.features || []).filter((f) => /appointment fee included/i.test(f));
    console.log(`  ${d.slug.padEnd(14)} ${p.name.padEnd(10)} excluded=${excl.length} included-feature=${feat.length}`);
  }
}

await mongoose.disconnect();
