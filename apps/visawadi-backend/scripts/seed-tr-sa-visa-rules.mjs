
import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const EU = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];
const GCC = ['AE','BH','KW','OM','QA','SA'];

const TR_CONDITIONAL_EVISA = ['IN','PK','BD','PH','NP','EG','LK'];

const RULES = [
  {
    destination: 'TR',
    destinationName: 'Türkiye',
    visaSlug: null,
    defaultOutcome: 'VISA_REQUIRED',
    groups: [
      {
        outcome: 'VISA_FREE',
        nationalities: [...EU, 'GB', 'US', ...GCC.filter((c) => c !== 'SA'), 'SA'],
        maxStayDays: 90,
        note: 'No visa needed for tourism, up to 90 days. Your passport must stay valid for at least 60 days beyond that.',
      },
      {
        outcome: 'EVISA',
        nationalities: TR_CONDITIONAL_EVISA,
        maxStayDays: 30,
        note: 'You can apply online for a single-entry e-Visa, but only if you already hold a valid Schengen, UK, US or Ireland visa or residence permit. A UAE residence permit on its own does not qualify. Without one you need a visa from a Turkish mission.',
      },
    ],
    residenceOverrides: [],
    officialSourceUrl: 'https://www.mfa.gov.tr/visa-information-for-foreigners.en.mfa',
    officialSourceName: 'Turkish Ministry of Foreign Affairs',
    generalNotes:
      'Syrian and Lebanese ordinary passport holders must apply at a Turkish mission. Note the e-Visa condition: it depends on holding another country\'s valid visa or residence permit, not on UAE residence.',
  },
  {
    destination: 'SA',
    destinationName: 'Saudi Arabia',
    visaSlug: null,
    defaultOutcome: 'VISA_REQUIRED',
    groups: [
      {
        outcome: 'VISA_FREE',
        nationalities: GCC.filter((c) => c !== 'SA'),
        maxStayDays: null,
        note: 'GCC citizens do not need a visa to enter Saudi Arabia.',
      },
    ],
    residenceOverrides: [],
    officialSourceUrl: 'https://www.visitsaudi.com/en/plan-your-trip/visa-regulations',
    officialSourceName: 'Visit Saudi (Saudi Tourism Authority)',
    generalNotes:
      'Around 66 nationalities (Group A) can get a tourist eVisa online or a visa on arrival rather than applying at an embassy, and holders of a used US, UK or Schengen visa may also qualify on arrival. Everyone else (Group B) applies through a Saudi embassy or consulate. This checker does not yet distinguish Group A from Group B, so it reports the requirement as a visa either way. Confirm the route that applies to you on the official portal before booking.',
  },
];

if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI. Run with --env-file=.env.production');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
}
const rules = conn.db.collection('visa-rules');

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

for (const r of RULES) {
  const exists = await rules.findOne({ destination: r.destination });
  console.log(`\n  ${exists ? 'update' : 'create'} ${r.destination}  ${r.destinationName}`);
  for (const g of r.groups) console.log(`    ${g.outcome}: ${g.nationalities.length} nationalities`);
  console.log(`    default: ${r.defaultOutcome}`);

  if (APPLY) {
    await rules.updateOne(
      { destination: r.destination },
      {
        $set: { ...r, isPublished: true, lastVerifiedAt: new Date(), updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
  }
}

console.log(APPLY ? '\nApplied.' : '\nDry run only.');
await mongoose.disconnect();
