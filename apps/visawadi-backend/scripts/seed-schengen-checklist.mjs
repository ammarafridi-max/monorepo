// Usage, from apps/visawadi-backend:
//   node --env-file=.env.development scripts/seed-schengen-checklist.mjs

import mongoose from 'mongoose';
import { DocumentTypeSchema, ChecklistTemplateSchema } from '@travel-suite/visa-applications';

const CUSTOMER = {
  PASSPORT: ['Passport', 'A clear scan of your passport photo page. Must be valid for at least 3 months after your trip.'],
  EMIRATES_ID: ['Emirates ID', 'Front and back of your Emirates ID.'],
  BANK_STATEMENT: ['Bank statement', 'Your last 3 to 6 months of personal bank statements, stamped by the bank.'],
  SALARY_CERTIFICATE: ['Salary certificate', 'A salary certificate from your employer, addressed to the embassy.'],
  EMPLOYMENT_NOC: ['Employment NOC', 'A no-objection letter from your employer approving your leave and trip.'],
  TRADE_LICENSE: ['Trade licence', 'A copy of your company trade licence.'],
  MOA: ['Memorandum of Association', 'Your company MOA showing your ownership.'],
  PENSION_STATEMENT: ['Pension statement', 'Proof of your pension income.'],
  SPONSORSHIP_LETTER: ['Sponsorship letter', 'A letter from your sponsor confirming they cover your trip costs.'],
  SPONSOR_BANK_STATEMENT: ['Sponsor bank statement', "Your sponsor's last 3 to 6 months of bank statements."],
  MARRIAGE_CERTIFICATE: ['Marriage certificate', 'Attested marriage certificate (when your spouse sponsors you).'],
  BIRTH_CERTIFICATE: ['Birth certificate', "The child's attested birth certificate."],
  PARENT_PASSPORT: ['Parent passport', "A copy of the accompanying parent's passport."],
  PARENT_EMIRATES_ID: ['Parent Emirates ID', "A copy of the accompanying parent's Emirates ID."],
  PARENTAL_CONSENT_LETTER: ['Parental consent letter', 'A signed consent letter from the parent(s) not travelling.'],
  TENANCY_CONTRACT: ['Tenancy contract (Ejari)', 'Your UAE tenancy contract. Optional but strengthens the application.'],
  INVITATION_LETTER: ['Invitation letter', 'A signed invitation letter from your host in the Schengen area.'],
  HOST_ID: ['Host ID / residence proof', "A copy of your host's ID or residence permit."],
};
const AGENT = {
  FLIGHT_RESERVATION: 'Flight reservation',
  HOTEL_RESERVATION: 'Hotel reservation',
  TRAVEL_INSURANCE: 'Travel insurance policy',
  COVER_LETTER: 'Cover letter',
  APPLICATION_FORM: 'Application form',
  APPOINTMENT_CONFIRMATION: 'Appointment confirmation',
};
const IN_PERSON = { PHOTO: 'Photo (taken at the centre)' };

function documentTypeDocs() {
  const out = [];
  let order = 0;
  for (const [key, [label, help]] of Object.entries(CUSTOMER)) out.push({ key, label, customerHelpText: help, source: 'CUSTOMER', sortOrder: (order += 10) });
  for (const [key, label] of Object.entries(AGENT)) out.push({ key, label, customerHelpText: '', source: 'AGENT', sortOrder: (order += 10) });
  for (const [key, label] of Object.entries(IN_PERSON)) out.push({ key, label, customerHelpText: '', source: 'IN_PERSON', sortOrder: (order += 10) });
  return out;
}

const R = (documentTypeKey, when = {}, isOptional = false) => ({ documentTypeKey, when, isOptional });
const EVERYONE = ['PASSPORT', 'EMIRATES_ID', 'PHOTO', 'FLIGHT_RESERVATION', 'TRAVEL_INSURANCE', 'COVER_LETTER', 'APPLICATION_FORM', 'APPOINTMENT_CONFIRMATION'];

function schengenRules() {
  return [
    ...EVERYONE.map((k) => R(k)),
    R('HOTEL_RESERVATION', { accommodationType: ['HOTEL'] }),
    R('INVITATION_LETTER', { accommodationType: ['HOST'] }),
    R('HOST_ID', { accommodationType: ['HOST'] }),
    R('BANK_STATEMENT', { ageGroup: ['ADULT'], financialSupport: ['SELF'] }),
    R('EMPLOYMENT_NOC', { ageGroup: ['ADULT'], employmentStatus: ['EMPLOYED'] }),
    R('SALARY_CERTIFICATE', { ageGroup: ['ADULT'], employmentStatus: ['EMPLOYED'] }),
    R('TRADE_LICENSE', { ageGroup: ['ADULT'], employmentStatus: ['SELF_EMPLOYED', 'BUSINESS_OWNER'] }),
    R('MOA', { ageGroup: ['ADULT'], employmentStatus: ['SELF_EMPLOYED', 'BUSINESS_OWNER'] }),
    R('PENSION_STATEMENT', { ageGroup: ['ADULT'], employmentStatus: ['RETIRED'] }),
    R('SPONSORSHIP_LETTER', { financialSupport: ['SPONSORED'] }),
    R('SPONSOR_BANK_STATEMENT', { financialSupport: ['SPONSORED'] }),
    R('MARRIAGE_CERTIFICATE', { financialSupport: ['SPONSORED'] }),
    R('BIRTH_CERTIFICATE', { ageGroup: ['MINOR'] }),
    R('PARENT_PASSPORT', { ageGroup: ['MINOR'] }),
    R('PARENT_EMIRATES_ID', { ageGroup: ['MINOR'] }),
    R('PARENTAL_CONSENT_LETTER', { ageGroup: ['MINOR'], minorTravellingWith: ['ONE_PARENT', 'NEITHER'] }),
    R('TENANCY_CONTRACT', { ageGroup: ['ADULT'] }, true),
  ];
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set (run with --env-file=.env.<env>)');
  await mongoose.connect(uri);
  const conn = mongoose.connection;
  if (conn.db.databaseName !== 'visawadi') {
    await mongoose.disconnect();
    throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
  }
  const DocumentType = mongoose.model('DocumentType', DocumentTypeSchema);
  const ChecklistTemplate = mongoose.model('ChecklistTemplate', ChecklistTemplateSchema);

  let created = 0;
  let updated = 0;
  for (const t of documentTypeDocs()) {
    const res = await DocumentType.updateOne(
      { key: t.key },
      { $set: { label: t.label, customerHelpText: t.customerHelpText, source: t.source, sortOrder: t.sortOrder }, $setOnInsert: { isActive: true } },
      { upsert: true },
    );
    if (res.upsertedCount) created += 1; else if (res.modifiedCount) updated += 1;
  }

  const rules = schengenRules();
  const missing = rules.map((r) => r.documentTypeKey).filter((k) => !documentTypeDocs().some((t) => t.key === k));
  if (missing.length) throw new Error(`Rules reference unknown document types: ${[...new Set(missing)].join(', ')}`);

  await ChecklistTemplate.updateOne(
    { visaTypeKey: 'SCHENGEN' },
    { $set: { name: 'Schengen visa', isActive: true, rules } },
    { upsert: true },
  );

  const totalTypes = await DocumentType.countDocuments({});
  console.log(`Document types: ${created} created, ${updated} updated, ${totalTypes} total.`);
  console.log(`Schengen template upserted with ${rules.length} rules.`);
  await mongoose.disconnect();
}

main().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
