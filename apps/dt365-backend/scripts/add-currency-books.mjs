/**
 * Usage: node --env-file=.env.production scripts/add-currency-books.mjs [--apply]
 *
 * Creates the currency records and dummy-ticket price books for the ten markets
 * the GA4 review identified. Rates are units per USD as of 18 Oct 2026. Dry run
 * unless --apply, and it backs up anything it would overwrite first.
 */
import mongoose from 'mongoose';
import { writeFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');

const MARKETS = [
  { code: 'SGD', name: 'Singapore Dollar',   symbol: 'S$', rate: 1.28,     prices: [17, 25, 27] },
  { code: 'AUD', name: 'Australian Dollar',  symbol: 'A$', rate: 1.44,     prices: [19, 28, 31] },
  { code: 'PKR', name: 'Pakistani Rupee',    symbol: 'Rs', rate: 276.99,   prices: [3599, 5299, 5799] },
  { code: 'IDR', name: 'Indonesian Rupiah',  symbol: 'Rp', rate: 18014.03, prices: [235000, 345000, 379000] },
  { code: 'PHP', name: 'Philippine Peso',    symbol: '₱',  rate: 63.03,    prices: [849, 1199, 1349] },
  { code: 'NGN', name: 'Nigerian Naira',     symbol: '₦',  rate: 1332.35,  prices: [17500, 25500, 28000] },
  { code: 'TRY', name: 'Turkish Lira',       symbol: '₺',  rate: 49.53,    prices: [649, 949, 1049] },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R',  rate: 16.47,    prices: [219, 319, 349] },
  { code: 'QAR', name: 'Qatari Riyal',       symbol: 'QAR', rate: 3.64,    prices: [49, 69, 79] },
  { code: 'THB', name: 'Thai Baht',          symbol: '฿',  rate: 33.43,    prices: [449, 649, 719] },
];

const VALIDITIES = ['2 Days', '7 Days', '14 Days'];

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not set. Run with --env-file.');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
console.log(`connected to database: ${db.databaseName}`);
console.log(APPLY ? 'MODE: APPLY (will write)' : 'MODE: DRY RUN (no writes)');

const currencies = db.collection('currencies');
const pricings = db.collection('dummy-ticket-pricings');

const sample = await pricings.findOne({ key: 'dummy-ticket' });
if (!sample) {
  console.error('no existing dummy-ticket price book found, cannot match the shape');
  process.exit(1);
}
console.log(`\nmatching the shape of the existing ${sample.currency} book`);

const plan = [];
for (const m of MARKETS) {
  const haveCur = await currencies.findOne({ code: m.code });
  const haveBook = await pricings.findOne({ key: 'dummy-ticket', currency: m.code });
  plan.push({ ...m, haveCur: !!haveCur, haveBook: !!haveBook });
}

console.log('\n  code  currency record   price book    prices (2 / 7 / 14)');
for (const p of plan) {
  console.log(
    `  ${p.code}   ${(p.haveCur ? 'exists' : 'CREATE').padEnd(16)} ${(p.haveBook ? 'exists' : 'CREATE').padEnd(12)} ${p.prices.join(' / ')}`,
  );
}

const newCur = plan.filter((p) => !p.haveCur).length;
const newBook = plan.filter((p) => !p.haveBook).length;
console.log(`\n  currency records to create: ${newCur}`);
console.log(`  price books to create     : ${newBook}`);

if (!APPLY) {
  console.log('\nDry run only. Re-run with --apply to write.');
  await mongoose.disconnect();
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const codes = MARKETS.map((m) => m.code);
const backup = {
  currencies: await currencies.find({ code: { $in: codes } }).toArray(),
  pricings: await pricings.find({ key: 'dummy-ticket', currency: { $in: codes } }).toArray(),
};
const backupPath = `scripts/backup-currency-books-${stamp}.json`;
writeFileSync(backupPath, JSON.stringify(backup, null, 2));
console.log(`\nbacked up ${backup.currencies.length} currency and ${backup.pricings.length} pricing documents to ${backupPath}`);

const now = new Date();
let curN = 0;
let bookN = 0;

for (const m of plan) {
  if (!m.haveCur) {
    await currencies.insertOne({
      code: m.code,
      name: m.name,
      symbol: m.symbol,
      rate: m.rate,
      isBaseCurrency: false,
      lastUpdated: now,
      createdAt: now,
      updatedAt: now,
      __v: 0,
    });
    curN += 1;
  }
  if (!m.haveBook) {
    await pricings.insertOne({
      key: 'dummy-ticket',
      currency: m.code,
      options: VALIDITIES.map((validity, i) => ({
        validity,
        price: m.prices[i],
        isActive: true,
        sortOrder: i,
      })),
      updatedBy: null,
      createdAt: now,
      updatedAt: now,
      __v: 0,
    });
    bookN += 1;
  }
}

console.log(`currency records created: ${curN}`);
console.log(`price books created     : ${bookN}`);
await mongoose.disconnect();
