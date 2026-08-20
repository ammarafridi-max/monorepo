/**
 * Seeds one visa rule per Schengen member state.
 *
 * The 29 members share ONE visa policy, so the nationality lists below are
 * common to all of them and are derived from Annex II of Regulation (EU)
 * 2018/1806 (the official list of visa-exempt third countries), plus EU/EEA/CH
 * nationals who travel under free movement rather than a visa waiver.
 *
 * Two deliberate adjustments to the 2018 text, both post-dating it:
 *   + GB  British citizens became visa-exempt third-country nationals after Brexit
 *   - VU  Vanuatu's exemption is suspended
 * Kosovo is deliberately absent: it gained visa-free travel in 2024 but has no
 * ISO 3166-1 alpha-2 code in our country list, so it needs handling separately.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/seed-schengen-visa-rules.mjs          # dry run
 *   node --env-file=.env.production scripts/seed-schengen-visa-rules.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const EU_SOURCE_URL = 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en';

/** No Schengen visa needed for a short stay: Annex II third countries + EU/EEA/CH. */
const NO_VISA_NEEDED = [
  'AD', 'AE', 'AG', 'AL', 'AR', 'AT', 'AU', 'BA', 'BB', 'BE',
  'BG', 'BN', 'BR', 'BS', 'CA', 'CH', 'CL', 'CO', 'CR', 'CY',
  'CZ', 'DE', 'DK', 'DM', 'EE', 'ES', 'FI', 'FM', 'FR', 'GB',
  'GD', 'GE', 'GR', 'GT', 'HK', 'HN', 'HR', 'HU', 'IE', 'IL',
  'IS', 'IT', 'JP', 'KI', 'KN', 'KR', 'LC', 'LI', 'LT', 'LU',
  'LV', 'MC', 'MD', 'ME', 'MH', 'MK', 'MO', 'MT', 'MU', 'MX',
  'MY', 'NI', 'NL', 'NO', 'NR', 'NZ', 'PA', 'PE', 'PL', 'PT',
  'PW', 'PY', 'RO', 'SB', 'SC', 'SE', 'SG', 'SI', 'SK', 'SM',
  'SV', 'TL', 'TO', 'TT', 'TV', 'TW', 'UA', 'US', 'UY', 'VA',
  'VC', 'VE', 'WS',
];

/**
 * Annex I nationalities that make up most of the UAE's resident population.
 * They need a Schengen visa regardless of UAE residence; what UAE residence
 * changes is where they file and which documents they bring.
 */
const UAE_RESIDENT_NATIONALITIES = ['IN', 'PK', 'BD', 'PH', 'EG', 'LK', 'NP', 'JO', 'LB', 'SY'];

const MEMBERS = [
  { code: 'AT', name: 'Austria', visaSlug: 'schengen', sourceUrl: 'https://www.bmeia.gv.at/en/', sourceName: 'Austrian Foreign Ministry' },
  { code: 'BE', name: 'Belgium', visaSlug: 'schengen', sourceUrl: 'https://dofi.ibz.be/en', sourceName: 'Belgian Immigration Office' },
  { code: 'BG', name: 'Bulgaria', visaSlug: 'schengen', sourceUrl: 'https://www.mfa.bg/en', sourceName: 'Bulgarian Foreign Ministry' },
  { code: 'HR', name: 'Croatia', visaSlug: 'schengen', sourceUrl: 'https://mvep.gov.hr/en', sourceName: 'Croatian Foreign Ministry' },
  { code: 'CZ', name: 'Czechia', visaSlug: 'schengen', sourceUrl: 'https://www.mvcr.cz/mvcren/', sourceName: 'Czech Interior Ministry' },
  { code: 'DK', name: 'Denmark', visaSlug: 'schengen', sourceUrl: 'https://www.nyidanmark.dk/en-GB', sourceName: 'Danish Immigration Service' },
  { code: 'EE', name: 'Estonia', visaSlug: 'schengen', sourceUrl: 'https://vm.ee/en', sourceName: 'Estonian Foreign Ministry' },
  { code: 'FI', name: 'Finland', visaSlug: 'schengen', sourceUrl: 'https://um.fi/frontpage', sourceName: 'Finnish Foreign Ministry' },
  { code: 'FR', name: 'France', visaSlug: 'france-visa', sourceUrl: 'https://france-visas.gouv.fr/en/web/france-visas/', sourceName: 'France-Visas' },
  { code: 'DE', name: 'Germany', visaSlug: 'germany-visa', sourceUrl: 'https://www.auswaertiges-amt.de/en', sourceName: 'German Federal Foreign Office' },
  { code: 'GR', name: 'Greece', visaSlug: 'schengen', sourceUrl: 'https://www.mfa.gr/en/', sourceName: 'Greek Foreign Ministry' },
  { code: 'HU', name: 'Hungary', visaSlug: 'schengen', sourceUrl: 'https://konzuliszolgalat.kormany.hu/en', sourceName: 'Hungarian Consular Service' },
  { code: 'IS', name: 'Iceland', visaSlug: 'schengen', sourceUrl: 'https://www.government.is/', sourceName: 'Government of Iceland' },
  { code: 'IT', name: 'Italy', visaSlug: 'italy-visa', sourceUrl: 'https://vistoperitalia.esteri.it/home/en', sourceName: 'Italian Foreign Ministry' },
  { code: 'LV', name: 'Latvia', visaSlug: 'schengen', sourceUrl: 'https://www.mfa.gov.lv/en', sourceName: 'Latvian Foreign Ministry' },
  { code: 'LI', name: 'Liechtenstein', visaSlug: 'schengen', sourceUrl: 'https://www.llv.li/', sourceName: 'Government of Liechtenstein' },
  { code: 'LT', name: 'Lithuania', visaSlug: 'schengen', sourceUrl: 'https://www.urm.lt/en', sourceName: 'Lithuanian Foreign Ministry' },
  { code: 'LU', name: 'Luxembourg', visaSlug: 'schengen', sourceUrl: 'https://maee.gouvernement.lu/en.html', sourceName: 'Luxembourg Foreign Ministry' },
  { code: 'MT', name: 'Malta', visaSlug: 'schengen', sourceUrl: 'https://identita.gov.mt/', sourceName: 'Identita Malta' },
  { code: 'NL', name: 'Netherlands', visaSlug: 'schengen', sourceUrl: 'https://ind.nl/en', sourceName: 'Dutch Immigration Service (IND)' },
  { code: 'NO', name: 'Norway', visaSlug: 'schengen', sourceUrl: 'https://www.udi.no/en/', sourceName: 'Norwegian Directorate of Immigration' },
  { code: 'PL', name: 'Poland', visaSlug: 'schengen', sourceUrl: 'https://www.gov.pl/web/diplomacy', sourceName: 'Polish Foreign Ministry' },
  { code: 'PT', name: 'Portugal', visaSlug: 'schengen', sourceUrl: 'https://aima.gov.pt/', sourceName: 'AIMA Portugal' },
  { code: 'RO', name: 'Romania', visaSlug: 'schengen', sourceUrl: 'https://www.mae.ro/en', sourceName: 'Romanian Foreign Ministry' },
  { code: 'SK', name: 'Slovakia', visaSlug: 'schengen', sourceUrl: 'https://www.mzv.sk/en/', sourceName: 'Slovak Foreign Ministry' },
  { code: 'SI', name: 'Slovenia', visaSlug: 'schengen', sourceUrl: 'https://www.gov.si/en/', sourceName: 'Government of Slovenia' },
  { code: 'ES', name: 'Spain', visaSlug: 'spain-visa', sourceUrl: 'https://www.exteriores.gob.es/en/', sourceName: 'Spanish Foreign Ministry' },
  { code: 'SE', name: 'Sweden', visaSlug: 'schengen', sourceUrl: 'https://www.migrationsverket.se/en/', sourceName: 'Swedish Migration Agency' },
  { code: 'CH', name: 'Switzerland', visaSlug: 'schengen', sourceUrl: 'https://www.sem.admin.ch/sem/en/home.html', sourceName: 'Swiss State Secretariat for Migration' },
];

function buildRule({ code, name, visaSlug, sourceUrl, sourceName }) {
  return {
    destination: code,
    destinationName: name,
    visaSlug,
    defaultOutcome: 'VISA_REQUIRED',
    groups: [
      {
        outcome: 'VISA_FREE',
        nationalities: NO_VISA_NEEDED,
        maxStayDays: 90,
        note: 'Up to 90 days in any 180-day period across the Schengen Area as a whole, not per country.',
      },
    ],
    residenceOverrides: [
      {
        residence: 'AE',
        nationalities: UAE_RESIDENT_NATIONALITIES,
        outcome: 'VISA_REQUIRED',
        maxStayDays: null,
        note: `UAE residence does not remove the Schengen visa requirement, but it does decide where you apply: ${name} applications are filed from the UAE rather than your country of nationality. Check your residence permit has enough validity left before you travel.`,
      },
    ],
    officialSourceUrl: sourceUrl,
    officialSourceName: sourceName,
    generalNotes: `Schengen short-stay policy is common to all 29 member states. Visa-exempt nationalities come from Annex II of Regulation (EU) 2018/1806; see ${EU_SOURCE_URL}. Some exemptions are conditional (biometric passport for Ukraine, Georgia, Moldova; specific passport types for Hong Kong, Macao, Taiwan, Serbia), so confirm the passport type before relying on this.`,
    isPublished: true,
    lastVerifiedAt: new Date(),
  };
}

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
console.log(`${MEMBERS.length} Schengen members, ${NO_VISA_NEEDED.length} nationalities needing no visa\n`);

let created = 0;
let updated = 0;
for (const m of MEMBERS) {
  const doc = buildRule(m);
  const existing = await rules.findOne({ destination: m.code });
  const action = existing ? 'update' : 'create';
  if (action === 'create') created++;
  else updated++;

  const before = existing
    ? `${(existing.groups?.[0]?.nationalities ?? []).length} visa-free`
    : 'none';
  console.log(`  ${action.padEnd(6)} ${m.code}  ${m.name.padEnd(15)} ${String(before).padEnd(14)} -> ${NO_VISA_NEEDED.length} visa-free  slug=${m.visaSlug}`);

  if (APPLY) {
    await rules.updateOne(
      { destination: m.code },
      { $set: { ...doc, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
  }
}

// The Schengen Area pseudo-destination shares the same policy.
const areaDoc = buildRule({
  code: 'XS',
  name: 'Schengen Area',
  visaSlug: 'schengen',
  sourceUrl: EU_SOURCE_URL,
  sourceName: 'European Commission',
});
console.log(`\n  update XS  Schengen Area   -> ${NO_VISA_NEEDED.length} visa-free  slug=schengen`);
if (APPLY) {
  await rules.updateOne(
    { destination: 'XS' },
    { $set: { ...areaDoc, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
}

console.log(`\n${created} to create, ${updated} to update, plus the Schengen Area entry.`);
if (APPLY) console.log('Applied.');

await mongoose.disconnect();
