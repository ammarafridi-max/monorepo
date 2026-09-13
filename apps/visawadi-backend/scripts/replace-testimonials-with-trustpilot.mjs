/**
 * The visa pages carried testimonials with no source. Replace the featured set
 * on every published visa with three real Trustpilot reviews (quoted as
 * written, one trimmed with an ellipsis to fit the 600-char field). Old
 * entries are kept but unfeatured. No Trustpilot logo or images are used.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/replace-testimonials-with-trustpilot.mjs          # dry run
 *   node --env-file=.env.production scripts/replace-testimonials-with-trustpilot.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const REVIEWS = [
  {
    name: 'Shazad Qamruddin',
    initials: 'SQ',
    visaType: 'Switzerland and UK visas',
    rating: 5,
    isFeatured: true,
    imageUrl: '',
    quote:
      'I had an Amazing experience with Visa wadi as i had applied twice for my Switzerland visa for UK visa and for Azarbaijan visa. Documentation were correctly placed and i had nothing to worry at the VFS office. Thanks to Omar for his help. My tickets, hotel reservations even my rail tickets were so perfect that i didnt had to answer any authority for any help. Great job. Next to Australia here i come',
  },
  {
    name: 'Yousef Abed',
    initials: 'YA',
    visaType: 'Hungary (Schengen) visa',
    rating: 5,
    isFeatured: true,
    imageUrl: '',
    quote:
      'Applied my Hungary visa through them, the process was smooth and they’ve got a very professional team. Recommend using their services.',
  },
  {
    name: 'Mohamed Zair',
    initials: 'MZ',
    visaType: 'Saudi, Turkey and Singapore visas',
    rating: 5,
    isFeatured: true,
    imageUrl: '',
    quote:
      'I’ve had a great experience with Visa Wadi as a UAE resident. Over the past year, they helped me with visas for Turkey, Saudi Arabia, Singapore, Malaysia and Azerbaijan, and every process was smooth and well handled. They guided me with the documents, passport requirements and everything needed for the visa center... Overall, Visa Wadi made the entire travel process much easier and more convenient. I would definitely recommend them to anyone in the UAE looking for reliable visa and travel assistance',
  },
];

for (const r of REVIEWS) if (r.quote.length > 600) throw new Error(`${r.name} quote is ${r.quote.length} chars`);

const isNew = (t) => REVIEWS.some((r) => r.name === t.name);

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
    if (!Array.isArray(d.testimonials)) continue;
    const slug = d.slug || d.visaSlug;
    const kept = d.testimonials.filter((t) => !isNew(t)).map((t) => ({ ...t, isFeatured: false }));
    const testimonials = [...REVIEWS, ...kept];
    console.log(`  ${coll}/${slug}: ${d.testimonials.filter((t) => t.isFeatured).length} featured -> 3 Trustpilot, ${kept.length} unfeatured`);
    if (APPLY) await c.updateOne({ _id: d._id }, { $set: { testimonials } });
  }
}

await mongoose.disconnect();
