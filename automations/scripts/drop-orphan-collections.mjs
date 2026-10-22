// Usage: node --env-file=../../apps/<brand>-backend/.env.production automations/scripts/drop-orphan-collections.mjs [--apply]
// Dry run by default. Drops only the collections listed per database, and only when the guard passes.

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const ORPHANS = {
  visawadi: [
    { name: 'checklisttemplates', supersededBy: 'checklist-templates', expectDocs: 1 },
  ],
  dummyticket365: [
    { name: 'hotel-reservation-pricings', supersededBy: 'hotel-booking-prices', expectDocs: 1 },
  ],
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

console.log(`${name}${APPLY ? '' : '  (dry run)'}`);

for (const { name: coll, supersededBy, expectDocs } of ORPHANS[name] ?? []) {
  if (!existing.has(coll)) {
    console.log(`  skip    ${coll}  (already gone)`);
    continue;
  }
  const count = await db.collection(coll).countDocuments();
  if (count !== expectDocs) {
    console.log(`  BLOCKED ${coll}  (holds ${count} docs, expected ${expectDocs} - inspect before dropping)`);
    continue;
  }
  if (!existing.has(supersededBy)) {
    console.log(`  BLOCKED ${coll}  (replacement ${supersededBy} does not exist)`);
    continue;
  }
  const liveCount = await db.collection(supersededBy).countDocuments();
  if (liveCount === 0) {
    console.log(`  BLOCKED ${coll}  (replacement ${supersededBy} is empty)`);
    continue;
  }
  if (!APPLY) {
    console.log(`  would   drop ${coll} (${count} docs); ${supersededBy} holds ${liveCount}`);
    continue;
  }
  await db.collection(coll).drop();
  console.log(`  dropped ${coll} (${count} docs); ${supersededBy} holds ${liveCount}`);
}

await conn.close();
