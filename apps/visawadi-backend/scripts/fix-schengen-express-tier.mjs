/**
 * The Schengen family sells Basic, Standard and Concierge. There is no Express
 * tier and no expedited processing: the embassy sets the decision time, and no
 * package changes it. What the tiers change is how fast the file is ready.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/fix-schengen-express-tier.mjs          # dry run
 *   node --env-file=.env.production scripts/fix-schengen-express-tier.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const SLUGS = ['schengen', 'france-visa', 'germany-visa', 'italy-visa', 'spain-visa', 'greece-visa'];

/** Spain files through BLS, everyone else through VFS. */
const centreFor = (slug) => (slug === 'spain-visa' ? 'BLS' : 'VFS');

const timelineAnswer = (centre) =>
  `Standard processing is 15 calendar days from your ${centre} appointment date. That is set by the embassy, not by us, so no package makes the decision come back faster. What the packages change is how quickly your file is ready to submit: 1 to 3 business days on Concierge, 3 to 4 on Basic and Standard. Expect longer waits over July and August, Christmas and the Eid holidays, when embassies are busiest.`;

const refusalAnswer = (centre) =>
  `Embassy and ${centre} fees are non-refundable for everyone, through any provider, because the embassy sets that rule rather than us. Our Concierge package includes a free resubmission with a revised file. Basic and Standard clients get a written analysis of the refusal and the specific changes to make before reapplying.`;

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
    const set = {};
    const notes = [];

    const faqs = (d.faqs || []).map((f) => {
      if (!/Express/.test(f.question + f.answer)) return f;
      if (/how long/i.test(f.question)) {
        notes.push('timeline FAQ');
        return { ...f, answer: timelineAnswer(centre) };
      }
      if (/refus/i.test(f.question)) {
        notes.push('refusal FAQ');
        return { ...f, answer: refusalAnswer(centre) };
      }
      notes.push(`unhandled FAQ: ${f.question}`);
      return f;
    });
    if (JSON.stringify(faqs) !== JSON.stringify(d.faqs || [])) set.faqs = faqs;

    if ((d.qualifierItems || []).some((q) => /Express/.test(q))) {
      set.qualifierItems = d.qualifierItems.map((q) =>
        /Express/.test(q)
          ? 'You are travelling soon and need your file ready in days, not weeks.'
          : q,
      );
      notes.push('qualifier');
    }

    if ((d.testimonials || []).some((t) => /Express/.test(JSON.stringify(t)))) {
      set.testimonials = d.testimonials.map((t) =>
        /Express/.test(JSON.stringify(t))
          ? {
              ...t,
              visaType: String(t.visaType || '').replace(/\bExpress\b/g, 'Concierge').trim(),
              quote: t.quote.replace(/Used the Express service —/, 'Used the Concierge service,').replace(/\bExpress\b/g, 'Concierge'),
            }
          : t,
      );
      notes.push('testimonial');
    }

    if (!Object.keys(set).length) continue;
    console.log(`  ${coll}/${slug}: ${notes.join(', ')}`);
    if (APPLY) await c.updateOne({ _id: d._id }, { $set: set });
  }
}

console.log('\n=== remaining "Express" where no Express package exists ===');
let left = 0;
for (const coll of ['visas', 'visa-overlays']) {
  for (const d of await conn.db.collection(coll).find({}).toArray()) {
    const names = (d.packages || []).map((p) => p.name);
    if (names.includes('Express')) continue;
    for (const m of JSON.stringify(d).matchAll(/.{0,60}Express.{0,60}/g)) {
      left++;
      console.log(`  ${coll}/${d.slug || d.visaSlug}: ...${m[0].slice(0, 130)}`);
    }
  }
}
console.log(`  total: ${left}`);

await mongoose.disconnect();
