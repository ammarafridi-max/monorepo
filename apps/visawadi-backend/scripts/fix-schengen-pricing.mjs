/**
 * H3. Reconciles the Schengen page's pricing to the confirmed tiers:
 * Basic AED 299, Standard AED 599, Concierge AED 699.
 *
 * The breakdown previously advertised a service fee of AED 499 and a note
 * naming an "Express" tier at AED 899 and a Concierge at AED 1,799. None of
 * those are products; they are pre-migration Travl figures.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/fix-schengen-pricing.mjs          # dry run
 *   node --env-file=.env.production scripts/fix-schengen-pricing.mjs --apply
 */

import mongoose from 'mongoose';
import VisaSchema from '@travel-suite/visa/schema';
import VisaOverlaySchema from '@travel-suite/visa/overlay-schema';

const APPLY = process.argv.includes('--apply');

const TIERS = { Basic: 299, Standard: 599, Concierge: 699 };
const SERVICE_FEE_NOTE = 'Basic package shown. Standard AED 599, Concierge AED 699.';

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
}
const Visa = conn.model('Visa', VisaSchema);
const Overlay = conn.model('visa-overlay', VisaOverlaySchema);

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

/** The overlay is what the page actually renders, so both layers need fixing. */
for (const [label, doc] of [
  ['base', await Visa.findOne({ slug: 'schengen' })],
  ['AE overlay', await Overlay.findOne({ residence: 'AE', visaSlug: 'schengen' })],
]) {
  if (!doc) {
    console.log(`  ${label}: not found, skipped`);
    continue;
  }
  console.log(`\n--- ${label}`);

  for (const p of doc.packages || []) {
    const want = TIERS[p.name];
    if (want !== undefined && p.price !== want) {
      console.log(`  package ${p.name}: ${p.price} -> ${want}`);
      p.price = want;
    }
  }

  const fee = (doc.pricingBreakdown || []).find((r) => /VisaWadi service fee/i.test(r.item));
  if (fee) {
    if (fee.amount !== TIERS.Basic) console.log(`  breakdown service fee: ${fee.amount} -> ${TIERS.Basic}`);
    if (fee.note !== SERVICE_FEE_NOTE) console.log(`  breakdown note: "${fee.note}" -> "${SERVICE_FEE_NOTE}"`);
    fee.amount = TIERS.Basic;
    fee.note = SERVICE_FEE_NOTE;
  }

  if (doc.metaDescription && doc.metaDescription.includes('From AED 499')) {
    const next = doc.metaDescription.replace('From AED 499', 'From AED 299');
    console.log(`  metaDescription: "From AED 499" -> "From AED 299"`);
    doc.metaDescription = next;
  }

  if (APPLY) {
    doc.markModified('packages');
    doc.markModified('pricingBreakdown');
    await doc.save();
    console.log('  saved');
  }
}

console.log('\n=== AUDIT: packages vs breakdown across every visa record ===');
for (const v of await Visa.find({}).sort({ slug: 1 }).lean()) {
  const fee = (v.pricingBreakdown || []).find((r) => /VisaWadi service fee/i.test(r.item));
  const prices = (v.packages || []).map((p) => p.price);
  const cheapest = prices.length ? Math.min(...prices) : null;
  const problems = [];
  if (fee && cheapest !== null && fee.amount !== cheapest) {
    problems.push(`service fee ${fee.amount} is not the cheapest package (${cheapest})`);
  }
  if (fee?.note) {
    for (const m of fee.note.matchAll(/AED\s?([\d,]+(?:\.\d+)?)/g)) {
      const n = Number(m[1].replace(/,/g, ''));
      if (!prices.includes(n)) problems.push(`note cites AED ${m[1]}, which is not a package price`);
    }
    for (const name of fee.note.matchAll(/\b(Basic|Standard|Express|Concierge|Premium)\b/g)) {
      if (!(v.packages || []).some((p) => p.name === name[1])) {
        problems.push(`note names tier "${name[1]}", which does not exist`);
      }
    }
  }
  console.log(
    `  ${v.slug.padEnd(16)} pkgs=[${prices.join(', ')}] fee=${fee ? fee.amount : '—'}  ${problems.length ? 'MISMATCH: ' + problems.join('; ') : 'ok'}`,
  );
}

await mongoose.disconnect();
