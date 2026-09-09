/**
 * Fact-checks the Schengen cluster against the Visa Code and stamps a verified
 * date only on the posts actually checked.
 *
 * Checked against Regulation (EC) No 810/2009 consolidated to 02.02.2020, read
 * from the EUR-Lex PDF, and Annex 25 of the Practical Handbook (reference
 * amounts notified by member states), version 01/04/2026:
 *
 *   Art. 15(3)  travel medical insurance, minimum EUR 30 000
 *   Art. 23(1)  decided within 15 CALENDAR days of lodging
 *   Art. 23(2)  extendable to a maximum of 45 calendar days
 *   Art. 24(2)  multiple-entry cascade, five-year ceiling
 *   Annex 25    per-country means of subsistence
 *
 * Three corrections, all of them claims the regulation contradicts:
 *
 *   1. "10 to 15 working days" on the Italy, Germany and France posts. Article
 *      23 counts calendar days; 15 working days is about 21 calendar days, so
 *      the posts promised a slower decision than the law allows and framed a
 *      breach of the deadline as normal.
 *   2. "up to 30 days for complex cases and up to 60 days in exceptional
 *      circumstances". There is no 30-day tier and 60 exceeds the legal
 *      maximum outright.
 *   3. "EUR 50 to EUR 100 per day" as the funds guideline, on three posts.
 *      Annex 25 puts Germany at EUR 45 and Spain at EUR 122.10 with a
 *      EUR 1 098.90 floor, so the range is wrong at both ends.
 *
 * The stamp reads "requirements checked", not "everything in this post checked":
 * partner pricing and service claims are not covered by these sources.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/verify-schengen-claims.mjs          # dry run
 *   node --env-file=.env.production scripts/verify-schengen-claims.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const CHECKED = '9 September 2026';
const BANK = '/blog/schengen-visa-bank-statement-requirements-for-uae-residents';

const FUNDS_FIX =
  `there is no single Schengen figure. Each member state notifies its own reference amount, from EUR 45 a day for Germany to EUR 122.10 a day for Spain, which also applies a EUR 1,098.90 floor per person whatever the trip length. The <a href="${BANK}">bank statement guide</a> lists them by country`;

const FIXES = {
  'italy-visa-from-uae-requirements-and-application-process': [
    ['Italy Schengen visa processing typically takes 10 to 15 working days from the date of your appointment, though it can take longer during peak periods.',
     'The Visa Code gives the consulate 15 calendar days from the date your application is lodged, extendable to a maximum of 45 in individual cases needing further scrutiny.'],
  ],
  'germany-visa-from-uae-step-by-step-application-guide': [
    ['Germany visa processing from the UAE typically takes <strong>10 to 15 working days</strong>. During peak travel seasons (summer and Christmas), it can take longer.',
     'The Visa Code gives the consulate <strong>15 calendar days</strong> from the date your application is lodged, extendable to a maximum of 45 in individual cases. Summer and Christmas push files towards the longer end.'],
  ],
  'france-visa-from-uae-application-process-documents-and-tips': [
    ['<strong>Step 5:</strong> Wait for processing — typically 10 to 15 working days, though it can take longer during peak periods',
     '<strong>Step 5:</strong> Wait for the decision, due within 15 calendar days of lodging and extendable to a maximum of 45 in individual cases'],
  ],
  'schengen-visa-for-first-time-applicants-how-to-prove-strong-ties-to-the-uae': [
    ['A common reference point used at VFS Global counters is approximately EUR 50 to EUR 100 per day of your stay, though individual embassies set their own thresholds.',
     `On the balance itself, ${FUNDS_FIX}.`],
    ['Standard processing for a Schengen visa from Dubai is 15 calendar days, though embassies can take up to 30 days for complex cases and up to 60 days in exceptional circumstances.',
     'Standard processing for a Schengen visa from Dubai is 15 calendar days from lodging, and the Visa Code allows that to be extended to a maximum of 45 calendar days in individual cases. No consulate may take longer than 45 on an admissible application.'],
  ],
  'schengen-visa-documents-checklist-for-uae-residents': [
    ['As a working guideline, most consulates expect to see roughly EUR 50 to EUR 100 per day of your planned trip, after accommodation and flights are already accounted for.',
     `On how much, ${FUNDS_FIX}.`],
  ],
  'how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide': [
    ['As a working guideline, most consulates expect to see roughly <strong>EUR 50 to EUR 100 per day</strong> of your planned trip, after accounting for accommodation and flights.',
     `On how much, ${FUNDS_FIX}.`],
  ],
  // Both of these already carried a checked date from the earlier pass, which
  // verified the articles that pass added and not this figure. Correcting them
  // is what makes those existing stamps true.
  'schengen-visa-interview-questions-how-to-prepare-from-the-uae': [
    ['As a guideline, EUR 50 to EUR 100 per day is what most consulates expect to see covered',
     'Thresholds are set per country, from EUR 45 a day for Germany to EUR 122.10 for Spain, so check the one you are applying to'],
  ],
  'schengen-visa-rejection-top-10-reasons-and-how-to-avoid-them': [
    ['As a working guideline, most consulates expect to see roughly EUR 50 to EUR 100 per day of your planned trip available, on top of prepaid flights and accommodation.',
     `On how much, ${FUNDS_FIX}.`],
  ],
  'what-to-do-if-your-schengen-visa-is-delayed-past-your-travel-date': [
    ['Apply at least 15 business days before your travel date, even though embassies officially accept applications up to 6 months in advance.',
     'Apply six to eight weeks before you travel. The decision alone is due within 15 calendar days of lodging and may take up to 45, and consulates accept applications up to six months ahead, so there is no advantage in leaving it late.'],
  ],
};

/** Posts whose Schengen requirement claims were read against the sources above. */
const VERIFIED = [
  ...Object.keys(FIXES),
  'switzerland-visa-from-uae-requirements-for-schengen-applicants',
  'greece-visa-from-uae-how-to-apply-and-what-to-expect',
  'netherlands-visa-from-uae-documents-and-process-explained',
  'proof-of-onward-travel-for-schengen-visa-why-dummy-tickets-work',
  'are-dummy-tickets-legal-what-uae-visa-applicants-should-know',
  'dummy-ticket-providers-compared-what-to-look-for-before-you-buy',
  'dummy-ticket-vs-real-flight-booking-which-one-does-your-visa-need',
  'what-is-a-dummy-ticket-and-when-do-you-need-one',
  'why-buying-a-real-ticket-before-your-visa-is-approved-is-a-risky-move',
  'pnr-codes-explained-what-they-are-and-how-visa-officers-verify-them',
];

const STAMP = `<p><em>Requirements checked ${CHECKED} against the sources above. Fees, processing times and document rules change without much notice, so confirm the detail that matters to you before you apply.</em></p>`;

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') { await mongoose.disconnect(); throw new Error(`Expected visawadi, got "${conn.db.databaseName}"`); }
const blogs = conn.db.collection('blogs');

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');
let missed = 0, fixed = 0, stamped = 0;

for (const slug of [...new Set(VERIFIED)]) {
  const b = await blogs.findOne({ slug });
  if (!b) { console.log(`  ${slug}: NOT FOUND`); missed++; continue; }
  let content = String(b.content);

  for (const [from, to] of FIXES[slug] || []) {
    if (!content.includes(from)) { console.log(`  ${slug}\n     MISS "${from.slice(0, 70)}"`); missed++; continue; }
    content = content.replace(from, to);
    fixed++;
    console.log(`  ${slug}\n     fixed: ${from.slice(0, 78)}`);
  }

  // Stamp inside the existing Sources block so provenance stays in one place.
  if (!/Requirements checked/.test(content)) {
    const anchor = '</ul>\n</div>';
    if (content.includes(anchor)) {
      content = content.replace(anchor, `</ul>\n${STAMP}\n</div>`);
      stamped++;
    } else {
      console.log(`  ${slug}: no sources block to stamp`);
      missed++;
    }
  }

  if (APPLY && content !== String(b.content)) {
    await blogs.updateOne({ _id: b._id }, { $set: { content, updatedAt: new Date() } });
  }
}

console.log(`\n  corrections applied: ${fixed}\n  posts stamped: ${stamped}\n  misses: ${missed}`);

console.log('\n--- verification ---');
const all = await blogs.find({ status: 'published' }).toArray();
const bad = ['10 to 15 working days', 'up to 60 days in exceptional', 'EUR 50 to EUR 100', '15 business days before your travel'];
for (const s of bad) console.log(`  "${s.slice(0, 40)}" remaining: ${all.filter((b) => String(b.content).includes(s)).length}`);
console.log(`  posts carrying a verified date: ${all.filter((b) => /Requirements checked|Checked \d|last checked/i.test(b.content)).length} / ${all.length}`);
console.log(APPLY ? '\napplied.' : '\nnothing written.');
await mongoose.disconnect();
