
import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const HEROES = {
  schengen:
    'A Schengen visa from the UAE costs EUR 90 in consular fees, roughly AED 385, plus a visa centre service charge from AED 146.74. The consulate then has 15 calendar days to decide. Most refusals are preventable document errors, so we check every file against current requirements before it goes in.',

  'germany-visa':
    'Germany runs its own application form, VIDEX, and your emirate of residence decides which centre you must use. The consular fee is EUR 90, roughly AED 385, and VFS Global charges AED 146.74 on top in Dubai and Abu Dhabi. We complete the form, book the right centre and prepare the file the consulate expects.',

  'spain-visa':
    'Spain is the one Schengen destination that does not use VFS. You need a BLS account, the Annex A form and the fees paid online before the appointment exists. Spain also sets the highest funds threshold in the bloc, EUR 122.10 a day with a EUR 1,098.90 floor whatever the trip length. We handle all of it.',

  'greece-visa':
    'Greece takes submissions at VFS in Wafi on a shorter counter window than most, and your Emirates ID decides which centre you use. Greece sets one of the lower funds thresholds too, EUR 50 per person per day with a EUR 300 minimum for stays up to five days. We prepare the file and book the slot that fits.',

  'saudi-arabia':
    'If you hold a UAE residence visa, you can visit Saudi Arabia on a one year, multiple entry eVisa. There is no embassy, no appointment in Dubai and no biometrics. It is AED 700 all in, covering the government eVisa fee and the mandatory medical insurance. We confirm you qualify and file it for you.',

  'united-kingdom':
    'The UK Standard Visitor visa is decided by the Home Office on your documents alone, with no interview in most cases and no visa centre checking the file for completeness first. That puts the whole weight on the written evidence. We build the file, book the appointment and check every document before it is submitted.',

  usa:
    'The US B1/B2 has no visa centre and no paper file to hide behind: a DS-160, the MRV fee, and a consular interview in Dubai or Abu Dhabi that turns on your ties to the UAE rather than your documents. We prepare the form and the interview so nothing you say contradicts what you filed.',

  canada:
    'Canada\'s visitor visa is filed to IRCC online and decided offshore, with biometrics given in Dubai or Abu Dhabi first. Officers weigh financial capacity, travel history and intent to return, and the refusal letter rarely says which of the three failed. We prepare the file so none of them is the weak one.',
};

const words = (s) => String(s).split(/\s+/).filter(Boolean).length;
const BANNED = /walk out with your visa|risen sharply|guarantee/i;

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') { await mongoose.disconnect(); throw new Error(`Expected visawadi, got "${conn.db.databaseName}"`); }
const db = conn.db;

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');
let bad = 0;
for (const [slug, heroSubheadline] of Object.entries(HEROES)) {
  const w = words(heroSubheadline);
  const ok = w >= 40 && w <= 65 && !BANNED.test(heroSubheadline);
  if (!ok) bad++;
  const v = await db.collection('visas').findOne({ slug });
  const o = await db.collection('visa-overlays').findOne({ visaSlug: slug });
  const wasFrom = o?.heroSubheadline ? 'overlay' : 'base';
  const was = o?.heroSubheadline || v?.heroSubheadline || '';
  console.log(`\n${slug}  ${words(was)}w (${wasFrom}) -> ${w}w${ok ? '' : '  *** CHECK ***'}`);
  console.log(`  ${heroSubheadline}`);
  if (APPLY) {
    if (v) await db.collection('visas').updateOne({ _id: v._id }, { $set: { heroSubheadline } });
    if (o) await db.collection('visa-overlays').updateOne({ _id: o._id }, { $set: { heroSubheadline } });
  }
}

console.log('\n--- verification ---');
const base = Object.fromEntries((await db.collection('visas').find({}).toArray()).map((v) => [v.slug, v]));
let under = 0, banned = 0;
for (const o of await db.collection('visa-overlays').find({}).toArray()) {
  const s = o.heroSubheadline || base[o.visaSlug]?.heroSubheadline || '';
  if (words(s) < 40) { under++; console.log(`  under 40w: ${o.visaSlug} (${words(s)})`); }
  if (BANNED.test(s)) { banned++; console.log(`  BANNED phrase: ${o.visaSlug}`); }
}
console.log(`  heroes under 40 words: ${under} / 10`);
console.log(`  outcome-promise or unsourced phrases: ${banned}`);
console.log(`  drafts failing the check: ${bad}`);
console.log(APPLY ? '\napplied.' : '\nnothing written.');
await mongoose.disconnect();
