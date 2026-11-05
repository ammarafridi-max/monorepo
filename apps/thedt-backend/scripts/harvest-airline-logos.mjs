// Usage: node --env-file=.env.production scripts/harvest-airline-logos.mjs [--apply] [--report] [--only AA,EK]
import mongoose from 'mongoose';
import { writeFileSync } from 'node:fs';
import {
  harvestLogoCandidates,
  reportHarvest,
  candidateWriteOps,
} from '@travel-suite/flights/logo-harvest';

const APPLY = process.argv.includes('--apply');
const REPORT = process.argv.includes('--report');
const onlyArg = process.argv[process.argv.indexOf('--only') + 1];
const ONLY = process.argv.includes('--only') && onlyArg
  ? new Set(onlyArg.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean))
  : null;

const DOMAIN = 'thedummyticket.com';
const UA = `${DOMAIN} airline-logo-harvest/1.0 (+https://${DOMAIN})`;

const withDb = async (fn) => {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    return await fn(mongoose.connection.db);
  } finally {
    await mongoose.disconnect();
  }
};

const { dbName, total } = await withDb(async (db) => ({
  dbName: db.databaseName,
  total: await db.collection('airlines').countDocuments(),
}));

console.log(`=== ${APPLY ? 'APPLY' : 'DRY RUN'} on database "${dbName}" ===\n`);
console.log(`  airlines in collection : ${total}`);

const harvest = await withDb((db) =>
  harvestLogoCandidates({
    collection: db.collection('airlines'),
    userAgent: UA,
    only: ONLY,
    log: console.log,
  }),
);

console.log(`  needing a logo         : ${harvest.codes.length}${ONLY ? ` (filtered to ${[...ONLY].join(', ')})` : ''}\n`);

if (!harvest.codes.length) {
  console.log('  nothing to harvest.');
  process.exit(0);
}

reportHarvest(harvest);

if (REPORT) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = `scripts/airline-logo-candidates-${stamp}.json`;
  writeFileSync(path, JSON.stringify(Object.fromEntries(harvest.byCode), null, 2));
  console.log(`\n  report written to ${path}`);
}

if (APPLY) {
  const ops = candidateWriteOps(harvest);
  if (ops.length) {
    const modified = await withDb(async (db) => (await db.collection('airlines').bulkWrite(ops)).modifiedCount);
    console.log(`\n  wrote logoCandidates for ${modified} airline(s); logo left untouched.`);
  } else {
    console.log('\n  no candidates to write.');
  }
} else {
  console.log('\n  dry run: nothing written. Re-run with --apply to store these candidates.');
}
