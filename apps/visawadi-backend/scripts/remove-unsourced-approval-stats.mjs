/**
 * H7b. Removes the "85 to 90% approval rate" claim from the visa FAQs. No
 * source for it exists in the repo or the CMS.
 *
 * The question asked for an approval rate, so it cannot stay once the number
 * goes. It is reframed onto the half of the answer that was always verifiable
 * and is the more useful question anyway: what actually causes refusals.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/remove-unsourced-approval-stats.mjs          # dry run
 *   node --env-file=.env.production scripts/remove-unsourced-approval-stats.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const RATE_RE = /\b\d{2}\s*(?:to|–|-)\s*\d{2}\s*(?:percent|%)|\b\d{2}[–-]\d{2}%/;

const questionFor = (country) => `What causes most ${country} visa refusals?`;
const answerFor = (country) =>
  `Most ${country} visa refusals are administrative rather than substantive. The recurring causes are a photo at the wrong dimensions, bank statements that do not line up with the declared funds, and a missing or out of date employer letter. None of those are judgement calls, which is why we check the whole file against the current requirements before it is submitted.`;

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
}

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

let changed = 0;
for (const coll of ['visas', 'visa-overlays']) {
  const c = conn.db.collection(coll);
  for (const d of await c.find({}).toArray()) {
    const slug = d.slug || d.visaSlug;
    let touched = false;
    const faqs = (d.faqs || []).map((f) => {
      const isRateFaq = /approval rate/i.test(f.question || '') && RATE_RE.test(f.answer || '');
      if (!isRateFaq) return f;
      touched = true;
      // "What is the Germany visa approval rate for ..." -> "Germany"
      const country = (f.question.match(/What is the (.+?) visa approval rate/i) || [, 'visa'])[1];
      return { ...f, question: questionFor(country), answer: answerFor(country) };
    });
    if (!touched) continue;
    changed++;
    console.log(`  ${coll} ${slug}`);
    if (APPLY) await c.updateOne({ _id: d._id }, { $set: { faqs } });
  }
}
console.log(`\n  ${changed} document(s) ${APPLY ? 'updated' : 'would change'}`);

console.log('\n=== remaining unsourced rate claims in the CMS ===');
let left = 0;
for (const coll of ['visas', 'visa-overlays', 'blogs']) {
  for (const d of await conn.db.collection(coll).find({}).toArray()) {
    for (const m of JSON.stringify(d).matchAll(/.{0,70}(approval rate|\b9[0-9]%|\b8[0-9]\s*(?:to|–|-)\s*9[0-9]).{0,70}/gi)) {
      left++;
      console.log(`  ${coll}/${d.slug || d.visaSlug}: ...${m[0].slice(0, 140)}`);
    }
  }
}
console.log(`  total: ${left}`);

await mongoose.disconnect();
