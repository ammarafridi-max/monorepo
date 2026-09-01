/**
 * The Schengen consular fee rose from EUR 80 to EUR 90 for adults, and EUR 40
 * to EUR 45 for children aged 6 to 11, on 11 June 2024. Every visa page still
 * quoted the old figure, and a few blog posts quoted stale AED equivalents.
 *
 * EUR 90 at EUR/AED 4.2633 (1 September 2026) is AED 384, so AED 385 is the
 * figure used throughout. The blogs previously said AED 350 to 370, which was
 * understated even before the increase.
 *
 * Sources: European Commission Migration and Home Affairs, "Schengen visa fee
 * increased as of 11 June 2024"; Fragomen, "Schengen Area: Visa Fee Increase
 * Effective June 11".
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/update-schengen-visa-fee.mjs          # dry run
 *   node --env-file=.env.production scripts/update-schengen-visa-fee.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const NEW_AED = 385;

/** Literal replacements. Nothing here matches "EUR 80,000", which is an
 *  insurance coverage figure in several posts and must not move. */
const BLOG_EDITS = {
  'france-visa-from-uae-application-process-documents-and-tips': [
    ['pay the visa fee (EUR 80 for adults in 2026)', 'pay the visa fee (EUR 90 for adults in 2026)'],
    [
      'The standard Schengen visa fee is EUR 80 for adults. Children between 6 and 12 years old are charged EUR 40.',
      'The standard Schengen visa fee is EUR 90 for adults. Children between 6 and 12 years old are charged EUR 45.',
    ],
  ],
  'switzerland-visa-from-uae-requirements-for-schengen-applicants': [
    ['(AED 360 approximately)', '(AED 385 approximately)'],
  ],
  'netherlands-visa-from-uae-documents-and-process-explained': [
    ['(approximately AED 360)', '(approximately AED 385)'],
  ],
  'italy-visa-from-uae-requirements-and-application-process': [
    ['approximately AED 350, subject to exchange rates', 'approximately AED 385, subject to exchange rates'],
  ],
  'schengen-visa-fees-in-2026-complete-cost-breakdown-for-uae-applicants': [
    ['AED 355 to 370', 'AED 380 to 390'],
    ['EUR 90 (approx. AED 360)', 'EUR 90 (approx. AED 385)'],
  ],
  'how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide': [
    ['(approximately AED 360)', '(approximately AED 385)'],
  ],
};

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
}

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');
console.log('\n--- visa pages ---');

const SCHENGEN_FAMILY = ['schengen', 'france-visa', 'germany-visa', 'italy-visa', 'spain-visa', 'greece-visa'];

for (const coll of ['visas', 'visa-overlays']) {
  const c = conn.db.collection(coll);
  for (const d of await c.find({}).toArray()) {
    const slug = d.slug || d.visaSlug;
    if (!SCHENGEN_FAMILY.includes(slug)) continue;
    const notes = [];

    const packages = (d.packages || []).map((p) => ({
      ...p,
      exclusions: (p.exclusions || []).map((x) => {
        if (!/embassy fee \(AED ~340\)/.test(x)) return x;
        notes.push(`${p.name} exclusion`);
        return x.replace('(AED ~340)', `(AED ~${NEW_AED})`);
      }),
    }));

    const pricingBreakdown = (d.pricingBreakdown || []).map((r) => {
      if (!/embassy visa fee/i.test(r.item)) return r;
      notes.push(`breakdown ${r.amount} -> ${NEW_AED}`);
      return {
        ...r,
        amount: NEW_AED,
        note: `Roughly AED ${NEW_AED} (EUR 90) for adults, and EUR 45 for children aged 6 to 11. The exact dirham amount depends on the exchange rate the day you pay.`,
      };
    });

    if (!notes.length) continue;
    console.log(`  ${coll}/${slug}: ${notes.join(', ')}`);
    if (APPLY) await c.updateOne({ _id: d._id }, { $set: { packages, pricingBreakdown } });
  }
}

console.log('\n--- blog posts ---');
const blogs = conn.db.collection('blogs');
for (const [slug, edits] of Object.entries(BLOG_EDITS)) {
  const b = await blogs.findOne({ slug });
  if (!b) { console.log(`  ${slug}: not found`); continue; }
  let content = String(b.content || '');
  const done = [];
  for (const [from, to] of edits) {
    if (!content.includes(from)) { console.log(`  ${slug}: MISSING "${from.slice(0, 50)}"`); continue; }
    content = content.replace(from, to);
    done.push(to.slice(0, 42));
  }
  if (!done.length) continue;
  console.log(`  ${slug.slice(0, 52)}: ${done.length} edit(s)`);
  if (APPLY) await blogs.updateOne({ _id: b._id }, { $set: { content } });
}

console.log('\n=== verification ===');
let stale = 0;
for (const coll of ['visas', 'visa-overlays']) {
  for (const d of await conn.db.collection(coll).find({}).toArray()) {
    for (const m of JSON.stringify(d).matchAll(/(AED ?~?340|EUR ?80(?!,|\d))/g)) {
      stale++;
      console.log(`  STALE ${coll}/${d.slug || d.visaSlug}: ${m[0]}`);
    }
  }
}
for (const b of await blogs.find({}).toArray()) {
  for (const m of String(b.content || '').matchAll(/EUR ?(?:80|40)(?!,|\d)/g)) {
    stale++;
    console.log(`  STALE blogs/${b.slug}: ${m[0]}`);
  }
}
console.log(`  stale fee references remaining: ${stale}`);

await mongoose.disconnect();
