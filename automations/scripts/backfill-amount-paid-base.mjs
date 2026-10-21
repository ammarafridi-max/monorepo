// Usage: node --env-file=../../apps/<brand>-backend/.env.production automations/scripts/backfill-amount-paid-base.mjs [--apply]
// Dry run by default. Fills amountPaidBase on paid dummy tickets that predate it, converting at the
// currency rates stored today. Rows whose currency has no rate are reported and left alone.

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI is not set; pass --env-file=<backend>/.env.production');
  process.exit(1);
}

const round2 = (value) => Math.round(Number(value) * 100) / 100;

const conn = await mongoose.createConnection(uri).asPromise();
const db = conn.db;
console.log(`${db.databaseName}${APPLY ? '' : '  (dry run)'}`);

const currencies = await db.collection('currencies').find({}).toArray();
const base = currencies.find((c) => c.isBaseCurrency);
if (!base) {
  console.error('  no base currency is configured; nothing can be converted');
  await conn.close();
  process.exit(1);
}

const rateFor = (code) => {
  const normalized = String(code ?? '').trim().toUpperCase();
  if (!normalized) return null;
  if (normalized === base.code) return 1;
  const rate = Number(currencies.find((c) => c.code === normalized)?.rate);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
};

const pending = await db
  .collection('dummy-tickets')
  .find({
    paymentStatus: 'PAID',
    'amountPaid.amount': { $ne: null },
    $or: [{ amountPaidBase: null }, { 'amountPaidBase.amount': null }],
  })
  .project({ sessionId: 1, amountPaid: 1 })
  .toArray();

console.log(`  base ${base.code}, ${pending.length} paid ticket(s) with no base amount`);

const skipped = [];
let converted = 0;

for (const ticket of pending) {
  const code = String(ticket.amountPaid?.currency ?? '').toUpperCase();
  const rate = rateFor(code);
  const amount = Number(ticket.amountPaid?.amount);

  if (rate === null || !Number.isFinite(amount)) {
    skipped.push(`${ticket.sessionId} (${code || 'no currency'})`);
    continue;
  }

  const amountPaidBase = { currency: base.code, amount: round2(amount / rate), rate };
  converted += 1;

  if (!APPLY) continue;
  await db
    .collection('dummy-tickets')
    .updateOne({ _id: ticket._id }, { $set: { amountPaidBase } });
}

console.log(`  ${APPLY ? 'converted' : 'would convert'} ${converted}`);
if (skipped.length) {
  console.log(`  skipped ${skipped.length} with no usable rate:`);
  for (const line of skipped) console.log(`    ${line}`);
}

await conn.close();
