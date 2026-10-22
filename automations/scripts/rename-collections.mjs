// Usage: node --env-file=../../apps/<brand>-backend/.env.production automations/scripts/rename-collections.mjs [--apply]
// Dry run by default. Renames the collections whose Mongoose model names changed; keyed by database name.

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const COMMON = [
  ['affiliateclicks', 'affiliate-clicks'],
  ['affiliatepayouts', 'affiliate-payouts'],
  ['nationalities', 'wis-nationalities'],
  ['products', 'stripe-products'],
  ['visa-queries', 'visa-requirement-searches'],
  ['dummy-ticket-pricings', 'dummy-ticket-prices'],
  ['hotel-booking-pricings', 'hotel-booking-prices'],
];

const PER_DB = {
  airportrides: [['bookings', 'transfer-bookings']],
};

const DROP_IF_EMPTY = {
  airportrides: ['users'],
  dummyticket365: ['hotel-reservations', 'users'],
  mydummyticket: ['blogtags', 'dummytickets', 'dummyticketpricings', 'stripewebhookevents', 'users'],
};

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI is not set; pass --env-file=<backend>/.env.production');
  process.exit(1);
}

const conn = await mongoose.createConnection(uri).asPromise();
const db = conn.db;
const name = db.databaseName;
const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));
const plan = [...COMMON, ...(PER_DB[name] ?? [])];

console.log(`${name}${APPLY ? '' : '  (dry run)'}`);

for (const [from, to] of plan) {
  if (!existing.has(from)) {
    console.log(`  skip    ${from} -> ${to}  (source missing)`);
    continue;
  }
  const count = await db.collection(from).estimatedDocumentCount();
  if (existing.has(to)) {
    const targetCount = await db.collection(to).estimatedDocumentCount();
    if (targetCount > 0) {
      console.log(`  BLOCKED ${from} -> ${to}  (target holds ${targetCount} docs; merge by hand)`);
      continue;
    }
    if (!APPLY) {
      console.log(`  would   drop empty ${to}, then rename ${from} (${count} docs) -> ${to}`);
      continue;
    }
    await db.collection(to).drop();
  }
  if (!APPLY) {
    console.log(`  would   ${from} (${count} docs) -> ${to}`);
    continue;
  }
  await db.collection(from).rename(to);
  console.log(`  renamed ${from} (${count} docs) -> ${to}`);
}

for (const name_ of DROP_IF_EMPTY[name] ?? []) {
  if (!existing.has(name_)) {
    console.log(`  skip    drop ${name_}  (missing)`);
    continue;
  }
  const count = await db.collection(name_).estimatedDocumentCount();
  if (count > 0) {
    console.log(`  BLOCKED drop ${name_}  (holds ${count} docs)`);
    continue;
  }
  if (!APPLY) {
    console.log(`  would   drop ${name_} (empty)`);
    continue;
  }
  await db.collection(name_).drop();
  console.log(`  dropped ${name_} (empty)`);
}

await conn.close();
