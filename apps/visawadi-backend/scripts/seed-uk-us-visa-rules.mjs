/**
 * Corrects the UK and US visa rules, which were seeded as starter data and
 * never verified. Both were telling Gulf nationals they could travel visa-free.
 *
 * The real position is that neither country is "visa free" for those travellers:
 * they need a travel authorisation, which is a different thing with its own cost,
 * application and refusal risk. The schema already has an ETA outcome for this.
 *
 * Sources fetched and parsed on 2026-08-20:
 *   UK  Immigration Rules Appendix ETA National List (gov.uk)
 *   US  Visa Waiver Program participants (dhs.gov), excluding the two countries
 *       listed there as terminated (Argentina, Uruguay)
 *
 * Canada is deliberately NOT touched: canada.ca blocks scripted access, so the
 * eTA list could not be verified against an official source.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/seed-uk-us-visa-rules.mjs          # dry run
 *   node --env-file=.env.production scripts/seed-uk-us-visa-rules.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

/** gov.uk Appendix ETA National List: these nationals need an ETA, not a visa. */
const UK_ETA = [
  'AD', 'AE', 'AG', 'AR', 'AT', 'AU', 'BB', 'BE', 'BG', 'BH',
  'BN', 'BR', 'BS', 'BZ', 'CA', 'CH', 'CL', 'CR', 'CY', 'CZ',
  'DE', 'DK', 'EE', 'ES', 'FI', 'FM', 'FR', 'GD', 'GR', 'GT',
  'GY', 'HK', 'HR', 'HU', 'IL', 'IS', 'IT', 'JP', 'KI', 'KN',
  'KR', 'KW', 'LI', 'LT', 'LU', 'LV', 'MC', 'MH', 'MO', 'MT',
  'MU', 'MV', 'MX', 'MY', 'NL', 'NO', 'NZ', 'OM', 'PA', 'PE',
  'PG', 'PL', 'PT', 'PW', 'PY', 'QA', 'RO', 'SA', 'SB', 'SC',
  'SE', 'SG', 'SI', 'SK', 'SM', 'TO', 'TV', 'TW', 'US', 'UY',
  'VA', 'VC', 'WS',
];

/** dhs.gov Visa Waiver Program participants: these nationals travel on an ESTA. */
const US_ESTA = [
  'AD', 'AT', 'AU', 'BE', 'BN', 'CH', 'CL', 'CZ', 'DE', 'DK',
  'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HR', 'HU', 'IE', 'IL',
  'IS', 'IT', 'JP', 'KR', 'LI', 'LT', 'LU', 'LV', 'MC', 'MT',
  'NL', 'NO', 'NZ', 'PL', 'PT', 'QA', 'SE', 'SG', 'SI', 'SK',
  'SM', 'TW',
];

/** Annex-I style nationalities that make up most of the UAE's resident population. */
const UAE_RESIDENT_NATIONALITIES = ['IN', 'PK', 'BD', 'PH', 'EG', 'LK', 'NP', 'JO', 'LB', 'SY'];

const RULES = [
  {
    destination: 'GB',
    destinationName: 'United Kingdom',
    visaSlug: 'united-kingdom',
    defaultOutcome: 'VISA_REQUIRED',
    groups: [
      {
        outcome: 'VISA_FREE',
        nationalities: ['IE'],
        maxStayDays: null,
        note: 'Irish citizens travel under the Common Travel Area and need neither a visa nor an ETA.',
      },
      {
        outcome: 'ETA',
        nationalities: UK_ETA,
        maxStayDays: 180,
        note: 'No visitor visa needed, but you must hold an approved Electronic Travel Authorisation before you travel. It costs GBP 20, covers stays of up to 6 months, and an airline can refuse boarding without it.',
      },
    ],
    residenceOverrides: [
      {
        residence: 'AE',
        nationalities: UAE_RESIDENT_NATIONALITIES,
        outcome: 'VISA_REQUIRED',
        maxStayDays: null,
        note: 'You need a UK Standard Visitor visa. UAE residence does not change that, but it does mean you apply and give biometrics in the UAE rather than in your country of nationality.',
      },
    ],
    officialSourceUrl: 'https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-eta-national-list',
    officialSourceName: 'UK Immigration Rules, Appendix ETA National List',
    generalNotes:
      'An ETA is an authorisation to travel, not a visa, and not a guarantee of entry. Nationals not on the ETA list need a Standard Visitor visa. Check the current position on gov.uk before you book.',
  },
  {
    destination: 'US',
    destinationName: 'United States',
    visaSlug: 'usa',
    defaultOutcome: 'VISA_REQUIRED',
    groups: [
      {
        outcome: 'VISA_FREE',
        nationalities: ['CA'],
        maxStayDays: 180,
        note: 'Canadian citizens travelling on a Canadian passport need neither a B1/B2 visa nor an ESTA for tourism or business by air.',
      },
      {
        outcome: 'ETA',
        nationalities: US_ESTA,
        maxStayDays: 90,
        note: 'You travel under the Visa Waiver Program on an approved ESTA rather than a B1/B2 visa. It covers stays of up to 90 days and must be approved before you board.',
      },
    ],
    residenceOverrides: [
      {
        residence: 'AE',
        nationalities: UAE_RESIDENT_NATIONALITIES,
        outcome: 'VISA_REQUIRED',
        maxStayDays: null,
        note: 'You need a B1/B2 visitor visa, which means a DS-160 and an in-person interview. UAE residents interview at the US Embassy in Abu Dhabi or the US Consulate General in Dubai.',
      },
    ],
    officialSourceUrl: 'https://www.dhs.gov/visa-waiver-program',
    officialSourceName: 'US Department of Homeland Security, Visa Waiver Program',
    generalNotes:
      'An ESTA is an authorisation to board, not a visa, and not a guarantee of entry. Travellers who have visited certain countries since 2011, or hold dual nationality of them, lose ESTA eligibility and need a visa.',
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
  const before = await rules.findOne({ destination: r.destination });
  const gulfBefore = ['SA', 'QA', 'KW', 'BH', 'OM', 'AE'].filter((c) =>
    (before?.groups ?? []).some((g) => g.outcome === 'VISA_FREE' && (g.nationalities ?? []).includes(c)),
  );
  console.log(`\n  ${r.destination} ${r.destinationName}`);
  console.log(`    was: ${gulfBefore.length ? `${gulfBefore.join(',')} listed VISA_FREE` : 'no Gulf states listed visa-free'}`);
  console.log(`    now: ${r.groups.map((g) => `${g.nationalities.length} x ${g.outcome}`).join(', ')}, default ${r.defaultOutcome}`);

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
