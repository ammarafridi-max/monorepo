/**
 * Usage, from apps/<brand>-backend:
 *   node --env-file=.env.production scripts/backfill-ticket-paid-at.mjs           # dry run
 *   node --env-file=.env.production scripts/backfill-ticket-paid-at.mjs --apply
 *
 * Gives already-paid tickets a paidAt so they keep showing in the admin's
 * recently-paid window. updatedAt is an approximation: it is the payment time
 * only for tickets nobody touched afterwards. Run once, before or right after
 * deploying the paidAt change.
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI. Run with --env-file=.env.production');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const tickets = mongoose.connection.db.collection('dummy-tickets');

const filter = { paymentStatus: 'PAID', paidAt: null };
const pending = await tickets.countDocuments(filter);
console.log(`Paid tickets without paidAt: ${pending}`);

if (!pending) {
  await mongoose.disconnect();
  process.exit(0);
}

const sample = await tickets.find(filter).sort({ updatedAt: -1 }).limit(5)
  .project({ sessionId: 1, createdAt: 1, updatedAt: 1 }).toArray();
for (const t of sample) {
  console.log(`  ${t.sessionId}  created ${t.createdAt?.toISOString()}  -> paidAt ${t.updatedAt?.toISOString()}`);
}

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to write.');
  await mongoose.disconnect();
  process.exit(0);
}

const result = await tickets.updateMany(filter, [{ $set: { paidAt: '$updatedAt' } }]);
console.log(`Updated ${result.modifiedCount} tickets.`);

const left = await tickets.countDocuments({ paymentStatus: 'PAID', paidAt: null });
console.log(`Paid tickets still without paidAt: ${left}`);

await mongoose.disconnect();
