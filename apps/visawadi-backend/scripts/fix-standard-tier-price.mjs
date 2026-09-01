/**
 * Aligns the Standard tier to AED 599 across the Schengen country pages.
 * Schengen itself was corrected earlier; these five still said 598.99, so the
 * same tier had two prices across near-identical pages.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/fix-standard-tier-price.mjs          # dry run
 *   node --env-file=.env.production scripts/fix-standard-tier-price.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const OLD = 598.99;
const NEW = 599;

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
    let touched = false;
    const notes = [];

    const packages = (d.packages || []).map((p) => {
      if (Number(p.price) !== OLD) return p;
      touched = true;
      notes.push(`${p.name} ${OLD} -> ${NEW}`);
      return { ...p, price: NEW };
    });

    // The breakdown note quotes the other tiers' prices in prose.
    const pricingBreakdown = (d.pricingBreakdown || []).map((r) => {
      if (!r.note?.includes('598.99')) return r;
      touched = true;
      notes.push('breakdown note');
      return { ...r, note: r.note.replace(/598\.99/g, String(NEW)) };
    });

    if (!touched) continue;
    console.log(`  ${coll}/${slug}: ${notes.join(', ')}`);
    if (APPLY) await c.updateOne({ _id: d._id }, { $set: { packages, pricingBreakdown } });
  }
}

console.log('\n=== remaining 598.99 anywhere in the CMS ===');
let left = 0;
for (const coll of ['visas', 'visa-overlays', 'blogs']) {
  for (const d of await conn.db.collection(coll).find({}).toArray()) {
    if (JSON.stringify(d).includes('598.99')) {
      left++;
      console.log(`  ${coll}/${d.slug || d.visaSlug}`);
    }
  }
}
console.log(`  total: ${left}`);

console.log('\n=== Standard tier price by page ===');
for (const d of await conn.db.collection('visas').find({}).sort({ slug: 1 }).toArray()) {
  const std = (d.packages || []).find((p) => p.name === 'Standard');
  if (std) console.log(`  ${d.slug.padEnd(16)} ${std.currency} ${std.price}`);
}

await mongoose.disconnect();
