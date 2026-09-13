/**
 * Step 1 of the Schengen-family process promised an online form with dates,
 * countries and document uploads. The real first step is a call-back request,
 * so the step now describes that.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/fix-process-step-one.mjs          # dry run
 *   node --env-file=.env.production scripts/fix-process-step-one.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const SLUGS = ['schengen', 'france-visa', 'germany-visa', 'italy-visa', 'spain-visa', 'greece-visa', 'united-kingdom', 'usa', 'canada'];
const OLD_RE = /under 5 minutes|document uploads|no office visit/i;
const STEP = {
  title: 'Request a free consultation',
  description: 'Tell us your destination, travel dates and who is travelling. A specialist calls you back during business hours, answers your questions and confirms which package fits.',
  icon: 'PhoneCall',
};

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
    if (!SLUGS.includes(slug) || !Array.isArray(d.processSteps) || !d.processSteps.length) continue;
    const first = d.processSteps[0];
    if (!OLD_RE.test(`${first.title} ${first.description}`)) continue;
    console.log(`  ${coll}/${slug}: "${first.title}" -> "${STEP.title}"`);
    if (APPLY) {
      const processSteps = [{ ...first, ...STEP }, ...d.processSteps.slice(1)];
      await c.updateOne({ _id: d._id }, { $set: { processSteps } });
    }
  }
}

console.log('\n=== verification: first step per visa ===');
for (const d of await conn.db.collection('visas').find({ slug: { $in: SLUGS } }).sort({ slug: 1 }).toArray()) {
  console.log(`  ${d.slug.padEnd(15)} ${d.processSteps?.[0]?.title ?? '-'}`);
}

await mongoose.disconnect();
