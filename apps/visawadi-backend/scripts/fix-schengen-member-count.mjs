/**
 * H5. The Schengen Area has 29 member states. Six visa records and three blog
 * posts said 27, while the homepage and nine other posts said 29, so the
 * Schengen page contradicted itself on the same screen.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/fix-schengen-member-count.mjs          # dry run
 *   node --env-file=.env.production scripts/fix-schengen-member-count.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

/** Only where 27 is being used as the Schengen member count. */
const RULES = [
  [/\ball 27 Schengen member states\b/g, 'all 29 Schengen member states'],
  [/\ball 27 Schengen states\b/g, 'all 29 Schengen states'],
  [/\ball 27 Schengen countries\b/g, 'all 29 Schengen countries'],
  [/\ball 27 member states\b/g, 'all 29 member states'],
  [/\b27 Schengen member countries\b/g, '29 Schengen member countries'],
  [/\b27 Schengen countries\b/g, '29 Schengen countries'],
  [/\b27 Schengen member states\b/g, '29 Schengen member states'],
  [/\b27 European countries\b/g, '29 European countries'],
];

const fix = (s) => RULES.reduce((acc, [re, to]) => acc.replace(re, to), s);

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
    const faqs = d.faqs || [];
    let touched = false;
    const next = faqs.map((f) => {
      const answer = fix(f.answer || '');
      const question = fix(f.question || '');
      if (answer !== f.answer || question !== f.question) touched = true;
      return { ...f, question, answer };
    });
    if (!touched) continue;
    console.log(`  ${coll} ${d.slug || d.visaSlug}`);
    if (APPLY) await c.updateOne({ _id: d._id }, { $set: { faqs: next } });
  }
}

const blogs = conn.db.collection('blogs');
for (const b of await blogs.find({}).toArray()) {
  const set = {};
  for (const field of ['content', 'quickAnswer', 'excerpt', 'metaDescription', 'title']) {
    const val = b[field];
    if (typeof val !== 'string') continue;
    const next = fix(val);
    if (next !== val) set[field] = next;
  }
  if (Array.isArray(b.faqs)) {
    const nextFaqs = b.faqs.map((f) => ({ ...f, question: fix(f.question || ''), answer: fix(f.answer || '') }));
    if (JSON.stringify(nextFaqs) !== JSON.stringify(b.faqs)) set.faqs = nextFaqs;
  }
  if (!Object.keys(set).length) continue;
  console.log(`  blogs ${b.slug} -> ${Object.keys(set).join(', ')}`);
  if (APPLY) await blogs.updateOne({ _id: b._id }, { $set: set });
}

console.log('\n=== remaining "27" used as a Schengen count ===');
let remaining = 0;
for (const coll of ['visas', 'visa-overlays', 'blogs']) {
  for (const d of await conn.db.collection(coll).find({}).toArray()) {
    for (const m of JSON.stringify(d).matchAll(/.{0,60}\b27\b.{0,60}/g)) {
      if (/schengen|european countr|member state/i.test(m[0])) {
        remaining++;
        console.log(`  ${coll}/${d.slug || d.visaSlug}: ...${m[0].slice(0, 130)}`);
      }
    }
  }
}
console.log(`  total: ${remaining}`);

await mongoose.disconnect();
