/**
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/seed-visa-rules.mjs            # dry run
 *   node --env-file=.env.production scripts/seed-visa-rules.mjs --apply
 *   node --env-file=.env.production scripts/seed-visa-rules.mjs --apply --publish
 *
 * Rules seed UNPUBLISHED unless --publish is passed; --publish makes unverified
 * data visible to the visa checker.
 */

import mongoose from 'mongoose';
import VisaRuleSchema from '@travel-suite/visa-requirements/schema';

const APPLY = process.argv.includes('--apply');
const PUBLISH = process.argv.includes('--publish');

const GCC_COMMON = ['IN', 'PK', 'BD', 'PH', 'EG', 'LK', 'NP', 'JO', 'LB', 'SY'];

const EU_EEA = [
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT',
  'NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','CH',
];

const SCHENGEN_VISA_FREE = [
  ...EU_EEA,
  'GB','US','CA','AU','NZ','JP','KR','SG','MY','AE','SA','QA','KW','BH','OM',
  'IL','BR','AR','CL','MX','HK','MO','TW','RS','AL','MK','ME','BA','GE','MD','UA',
];

const DESTINATIONS = [
  {
    destination: 'DE', destinationName: 'Germany', visaSlug: 'germany-visa',
    groups: [{ outcome: 'VISA_FREE', nationalities: SCHENGEN_VISA_FREE, maxStayDays: 90,
               note: 'Up to 90 days in any 180-day period across the Schengen Area.' }],
    officialSourceName: 'German Federal Foreign Office',
    officialSourceUrl: 'https://www.auswaertiges-amt.de/en/visa-service',
  },
  {
    destination: 'FR', destinationName: 'France', visaSlug: 'france-visa',
    groups: [{ outcome: 'VISA_FREE', nationalities: SCHENGEN_VISA_FREE, maxStayDays: 90,
               note: 'Up to 90 days in any 180-day period across the Schengen Area.' }],
    officialSourceName: 'France-Visas',
    officialSourceUrl: 'https://france-visas.gouv.fr/en/web/france-visas/',
  },
  {
    destination: 'IT', destinationName: 'Italy', visaSlug: 'italy-visa',
    groups: [{ outcome: 'VISA_FREE', nationalities: SCHENGEN_VISA_FREE, maxStayDays: 90,
               note: 'Up to 90 days in any 180-day period across the Schengen Area.' }],
    officialSourceName: 'Italian Ministry of Foreign Affairs',
    officialSourceUrl: 'https://vistoperitalia.esteri.it/home/en',
  },
  {
    destination: 'ES', destinationName: 'Spain', visaSlug: 'spain-visa',
    groups: [{ outcome: 'VISA_FREE', nationalities: SCHENGEN_VISA_FREE, maxStayDays: 90,
               note: 'Up to 90 days in any 180-day period across the Schengen Area.' }],
    officialSourceName: 'Ministry of Foreign Affairs, Spain',
    officialSourceUrl: 'https://www.exteriores.gob.es/en/ServiciosAlCiudadano/Paginas/Servicios-consulares.aspx',
  },
  {
    destination: 'GB', destinationName: 'United Kingdom', visaSlug: 'united-kingdom',
    groups: [
      { outcome: 'ETA', nationalities: ['AE','SA','QA','KW','BH','OM','JO'], maxStayDays: 180,
        note: 'Electronic Travel Authorisation required before travel.' },
      { outcome: 'VISA_FREE', nationalities: [...EU_EEA,'US','CA','AU','NZ','JP','KR','SG','MY','HK','IL','BR','CL','MX'],
        maxStayDays: 180, note: 'Check whether an ETA is required for your passport before booking.' },
    ],
    officialSourceName: 'UK Government',
    officialSourceUrl: 'https://www.gov.uk/check-uk-visa',
  },
  {
    destination: 'US', destinationName: 'United States', visaSlug: 'usa',
    groups: [
      { outcome: 'ETA', nationalities: [...EU_EEA,'GB','JP','KR','SG','AU','NZ','CL','IL','TW','BN'],
        maxStayDays: 90, note: 'Visa Waiver Program: ESTA approval required before travel.' },
    ],
    officialSourceName: 'US Department of State',
    officialSourceUrl: 'https://travel.state.gov/content/travel/en/us-visas.html',
  },
  {
    destination: 'CA', destinationName: 'Canada', visaSlug: 'canada',
    groups: [
      { outcome: 'ETA', nationalities: [...EU_EEA,'GB','US','AU','NZ','JP','KR','SG','IL','CL','MX','AE'],
        maxStayDays: 180, note: 'Electronic Travel Authorization (eTA) required for air travel.' },
    ],
    officialSourceName: 'Government of Canada',
    officialSourceUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html',
  },
];

DESTINATIONS.push({
  destination: 'XS', destinationName: 'Schengen Area', visaSlug: 'schengen',
  groups: [{ outcome: 'VISA_FREE', nationalities: SCHENGEN_VISA_FREE, maxStayDays: 90,
             note: 'Up to 90 days in any 180-day period across all 29 Schengen countries.' }],
  officialSourceName: 'European Commission',
  officialSourceUrl: 'https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa_en',
});

const RESIDENCE_NOTE =
  'Based on UAE residence. Confirm your permit has enough validity remaining before you travel.';
for (const d of DESTINATIONS) {
  d.residenceOverrides = [
    {
      residence: 'AE',
      nationalities: GCC_COMMON,
      outcome: 'VISA_REQUIRED',
      note: `${RESIDENCE_NOTE} UAE residence does not remove the visa requirement for ${d.destinationName}, but it does change which documents you file and where.`,
    },
  ];
  d.defaultOutcome = 'VISA_REQUIRED';
  d.isPublished = false;
  d.generalNotes =
    'Seeded starter data. Verify every list against the official source above before publishing.';
}

if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI. Run with --env-file=.env.production');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;
if (db.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${db.db.databaseName}"`);
}
const VisaRule = db.model('visa-rule', VisaRuleSchema);

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');
let created = 0;
let skipped = 0;

for (const d of DESTINATIONS) {
  const existing = await VisaRule.findOne({ destination: d.destination });
  if (existing) {
    skipped++;
    console.log(`  ${d.destination} ${d.destinationName}: exists, left alone`);
    continue;
  }
  const counts = d.groups.map((g) => `${g.outcome}=${g.nationalities.length}`).join(' ');
  if (!APPLY) {
    console.log(`  ${d.destination} ${d.destinationName}: would create (${counts}, ${d.residenceOverrides.length} residence override)`);
    continue;
  }
  await VisaRule.create({ ...d, lastVerifiedAt: null });
  created++;
  console.log(`  ${d.destination} ${d.destinationName}: created unpublished (${counts})`);
}

let published = 0;
if (APPLY && PUBLISH) {
  const res = await VisaRule.updateMany({ isPublished: false }, { $set: { isPublished: true } });
  published = res.modifiedCount || 0;
}

console.log(`\ncreated=${created} skipped=${skipped} published=${published}`);
if (PUBLISH) {
  console.log('Rules are LIVE but unverified — every answer carries a warning until lastVerifiedAt is set.');
} else {
  console.log('All rules are UNPUBLISHED. The checker will not serve them until each is verified and published.');
}
await mongoose.disconnect();
