/**
 * Rewrites the Schengen fees post around the fee/cost query cluster it already
 * ranks for (positions 4.6 to 13.6, 2 clicks across 22 queries), and removes the
 * stale AED figures that update-schengen-visa-fee.mjs could not reach.
 *
 * That script only rewrites `content`. The stale numbers on this post live in
 * `quickAnswer` ("approximately AED 360") and `faqs[].answer` ("AED 355 to 370"),
 * which is why its blog edits report MISSING and the figures survived. This one
 * rewrites all four fields together.
 *
 * AED_ADULT is the single source of truth for the dirham figure; the child fee
 * and the table are derived from it. EUR 90 at EUR/AED 4.269 (8 September 2026)
 * is AED 384, so 385 is used, matching every Schengen money page.
 *
 * Sources: European Commission, "Schengen visa fee increased as of 11 June 2024"
 * (EUR 80 to EUR 90 adults, EUR 40 to EUR 45 for children aged six to below 12);
 * VFS Global Germany UAE one-pager (AED 146.74 service fee, Dubai and Abu Dhabi).
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/rewrite-schengen-fees-post.mjs          # dry run
 *   node --env-file=.env.production scripts/rewrite-schengen-fees-post.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const SLUG = 'schengen-visa-fees-in-2026-complete-cost-breakdown-for-uae-applicants';

const EUR_ADULT = 90;
const EUR_CHILD = 45;
const AED_ADULT = 385;
const AED_CHILD = Math.round((AED_ADULT / EUR_ADULT) * EUR_CHILD);
const VFS_DE = '146.74';
const CHECKED = '8 September 2026';

const SRC_EC =
  'https://home-affairs.ec.europa.eu/news/schengen-visa-fee-increased-11-june-2024-2024-06-13_en';
const SRC_VFS = 'https://visa.vfsglobal.com/one-pager/germany/uae/english/';
// Kept as factual references, not purchase CTAs. Travl owns insurance and
// Dummy Ticket 365 owns flight reservations; both are named because the reader
// needs to know what the documents are, not because we want the click.
const REF_INSURANCE =
  'https://www.travl.ae/blog/schengen-visa-travel-insurance-requirements-minimum-coverage-explained';
const REF_TICKET = 'https://www.dummyticket365.com';
const ext = (href, text) =>
  `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;

const metaTitle = `Schengen Visa Cost from UAE 2026: EUR ${EUR_ADULT} + VFS Charges`;

const metaDescription =
  `The Schengen visa fee is EUR ${EUR_ADULT} for adults, roughly AED ${AED_ADULT}, plus a VFS ` +
  `service charge from AED ${VFS_DE}. Full 2026 cost breakdown for UAE applicants.`;

const quickAnswer =
  `A Schengen visa costs EUR ${EUR_ADULT} for adults in 2026, roughly AED ${AED_ADULT} at current ` +
  `rates. Children aged 6 to 11 pay EUR ${EUR_CHILD}. Under 6 is free. On top of that you pay the ` +
  `visa centre a service charge, from AED ${VFS_DE} at VFS Global, plus mandatory travel insurance. ` +
  `A single adult applying from Dubai should budget AED 550 to AED 700 all in. Fees last checked ${CHECKED}.`;

const TABLE = `<table>
<thead><tr><th>Cost</th><th>Amount (AED)</th><th>Mandatory</th></tr></thead>
<tbody>
<tr><td>Schengen visa fee (EUR ${EUR_ADULT})</td><td>~${AED_ADULT}</td><td>Yes</td></tr>
<tr><td>VFS Global or BLS service charge</td><td>147 to 150</td><td>Yes</td></tr>
<tr><td>Travel insurance, EUR 30,000 cover</td><td>80 to 150</td><td>Yes</td></tr>
<tr><td>Biometric photos</td><td>20 to 30</td><td>Yes</td></tr>
<tr><td>Flight reservation for the application</td><td>45 to 75</td><td>Yes</td></tr>
<tr><td>Courier return of passport</td><td>30 to 60</td><td>No</td></tr>
<tr><td>SMS updates</td><td>10 to 15</td><td>No</td></tr>
<tr><td><strong>Realistic total</strong></td><td><strong>AED 550 to 700</strong></td><td></td></tr>
</tbody>
</table>`;

const content = `<p>The Schengen visa fee is the same in all 29 member states, but it is only part of what you pay. Once you add the visa centre service charge, mandatory insurance, photos and a flight reservation, a single application from Dubai lands between AED 550 and AED 700.</p>
<p>Here is every 2026 cost, where each figure comes from, and which ones you can skip.</p>

<h2>How much does a Schengen visa cost in 2026?</h2>
<p>The Schengen visa fee is <strong>EUR ${EUR_ADULT} for adults</strong>. It is set by EU regulation and is identical across all 29 Schengen countries, so France, Germany, Italy, Spain, Greece and the rest all charge the same. The fee rose from EUR 80 on 11 June 2024, and any guide still quoting EUR 80 is out of date. You pay it at the visa application centre when you submit.</p>
<p>Source: ${ext(SRC_EC, 'European Commission, Schengen visa fee increased as of 11 June 2024')}.</p>

<h2>How much is the Schengen visa fee in dirhams?</h2>
<p>EUR ${EUR_ADULT} works out to roughly <strong>AED ${AED_ADULT}</strong>, though the exact dirham amount depends on the exchange rate on the day you apply. Visa centres in the UAE collect the fee in dirhams at the rate set by the consulate, which they update periodically rather than daily. Budget AED ${AED_ADULT} and expect the counter figure to land within a few dirhams either side.</p>

<h2>How much do VFS Global and BLS International charge on top?</h2>
<p>The visa centre charges a separate, non-refundable service fee. Germany's VFS Global centres in Dubai and Abu Dhabi charge <strong>AED ${VFS_DE}</strong> per application, taxes included. Other missions set their own rates, typically AED 90 to AED 150. Spain runs through BLS International rather than VFS, with its own fee schedule. Check your specific consulate's page before you budget.</p>
<p>Which centre you deal with depends on the country, not on you. From the UAE, France, Germany, Italy and Greece all run through VFS Global, with Greece filing at the Wafi centre in Dubai. Spain is the outlier and goes through BLS International, which sets its own service fee and runs its own appointment system. If you are choosing between two consulates on cost alone, the service charge is the only part that actually differs, and it is rarely more than AED 60 between them.</p>
<p>Optional add-ons at the centre, such as courier return of your passport, SMS tracking or premium lounge access, are charged on top of that again.</p>
<p>Source: ${ext(SRC_VFS, 'VFS Global, Germany UAE fee page')}.</p>

<h2>How much is the Schengen visa fee for children?</h2>
<p>Children aged 6 to 11 pay a reduced fee of <strong>EUR ${EUR_CHILD}</strong>, around AED ${AED_CHILD}. Children under 6 are exempt from the visa fee entirely. The visa centre service charge still applies to every applicant regardless of age, so a family of four with two young children still pays four service charges even though the youngest pays no visa fee.</p>

<h2>What is the total cost of a Schengen visa from Dubai?</h2>
<p>A single adult applying from Dubai should budget <strong>AED 550 to AED 700</strong> all in. That covers the EUR ${EUR_ADULT} visa fee, the visa centre service charge, Schengen-compliant travel insurance, biometric photos and a flight reservation for your application. Optional extras such as courier return, SMS tracking or premium lounge access push it higher.</p>
<p>Two of those line items trip people up. Your insurance has to provide at least EUR 30,000 in medical cover, be valid across all 29 Schengen countries for the full trip, and include emergency repatriation; a policy that covers only your first destination gets rejected at the counter. ${ext(REF_INSURANCE, 'What the coverage minimum actually means')} is worth reading before you buy anything.</p>
<p>For the flight, applicants normally submit a verified reservation rather than <a href="/blog/why-buying-a-real-ticket-before-your-visa-is-approved-is-a-risky-move">a paid ticket bought before a decision</a>. What the consulate checks is that the booking carries a real <a href="/blog/pnr-codes-explained-what-they-are-and-how-visa-officers-verify-them">PNR it can look up on the airline's system</a>, which is what a reservation from a provider such as ${ext(REF_TICKET, 'Dummy Ticket 365')} gives you. Photos are the cheapest item on the list and the one most often redone on the spot: Schengen specifications are stricter than a standard passport photo, so budget for a second set.</p>
${TABLE}
<p>Figures are per applicant. Fees last checked ${CHECKED}.</p>

<h2>What else do you pay for beyond the fees?</h2>
<p>Several costs sit outside the published fee schedule. Certified translations if your documents are not in English. Bank charges for stamped statements, commonly AED 25 to 50. Some employers charge for an NOC letter. Attestation, if a consulate asks for it on a marriage or birth certificate, is its own separate fee.</p>
<p>If you are travelling as a family, every one of these multiplies by the number of applicants. Two adults and two children aged 8 and 4 pay two adult visa fees, one child visa fee, four service charges, four insurance policies and four sets of photos, which is how a four-person application quietly passes AED 2,000 even though one of the four pays no visa fee at all.</p>

<h2>Do you get the visa fee back if your application is refused?</h2>
<p>No. Both the EUR ${EUR_ADULT} visa fee and the visa centre service charge are non-refundable, whatever the outcome. A refusal means you pay again in full to reapply, and a reapplication with the same weak file usually fails the same way. This is why the document pack matters more than any other part of the process.</p>
<p>The <a href="/blog/schengen-visa-rejection-top-10-reasons-and-how-to-avoid-them">top 10 reasons Schengen visas get rejected</a> are almost all preventable, and the <a href="/blog/schengen-visa-documents-checklist-for-uae-residents">Schengen visa documents checklist for UAE residents</a> sets out what the consulate expects to see. For the process end to end, see the <a href="/blog/how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide">complete 2026 Schengen visa guide for UAE residents</a>.</p>

<p>Applying from the UAE? <a href="/uae/visa/schengen">VisaWadi's Schengen Basic package</a> is AED 299 and includes the flight reservation, hotel booking, 9-day travel insurance and a day-by-day itinerary your consulate expects, so several of the line items above are already covered. <a href="/uae/visa/schengen">See what's included</a>, or check the <a href="/faq">VisaWadi FAQ</a> for what the packages do and do not carry.</p>`;

const faqs = [
  {
    question: `How much does a Schengen visa cost in 2026?`,
    answer: `The Schengen visa fee is EUR ${EUR_ADULT} for adults, roughly AED ${AED_ADULT}. It is set by EU regulation and is the same in all 29 Schengen countries. The fee rose from EUR 80 on 11 June 2024, so any guide still quoting EUR 80 is out of date. The visa centre service charge is separate and is paid on top.`,
  },
  {
    question: `How much is the Schengen visa fee in dirhams?`,
    answer: `EUR ${EUR_ADULT} is roughly AED ${AED_ADULT}, though the exact amount depends on the exchange rate on the day you apply. UAE visa centres collect the fee in dirhams at the rate set by the consulate, which is updated periodically rather than daily. Budget AED ${AED_ADULT} and expect the counter figure to be within a few dirhams of it. Last checked ${CHECKED}.`,
  },
  {
    question: `How much do VFS Global and BLS International charge on top of the visa fee?`,
    answer: `The visa centre charges a separate, non-refundable service fee. Germany's VFS Global centres in Dubai and Abu Dhabi charge AED ${VFS_DE} per application including taxes. Other missions set their own rates, typically AED 90 to AED 150, and Spain runs through BLS International with its own schedule. Confirm the figure on your consulate's page before you budget.`,
  },
  {
    question: `How much is the Schengen visa fee for children?`,
    answer: `Children aged 6 to 11 pay a reduced fee of EUR ${EUR_CHILD}, around AED ${AED_CHILD}. Children under 6 pay no visa fee at all. The visa centre service charge still applies to every applicant regardless of age, so a family pays one service charge per person even for children who are exempt from the visa fee.`,
  },
  {
    question: `What is the total cost of a Schengen visa from Dubai?`,
    answer: `A single adult should budget AED 550 to AED 700 all in. That covers the EUR ${EUR_ADULT} visa fee at roughly AED ${AED_ADULT}, the visa centre service charge, Schengen-compliant travel insurance with EUR 30,000 medical cover, biometric photos and a flight reservation for the application. Courier return, SMS tracking and premium lounge access are optional and push it higher.`,
  },
  {
    question: `Is the Schengen visa fee refundable if my application is refused?`,
    answer: `No. Both the EUR ${EUR_ADULT} visa fee and the visa centre service charge are non-refundable regardless of whether your visa is approved, refused or withdrawn. Reapplying means paying both again in full, which is why the strength of the document pack matters more than any other part of the process.`,
  },
];

const words = (s) => String(s).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
}

const blogs = conn.db.collection('blogs');
const before = await blogs.findOne({ slug: SLUG });
if (!before) {
  await mongoose.disconnect();
  throw new Error(`Post not found: ${SLUG}`);
}

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');
console.log(`\nslug (unchanged): ${before.slug}`);
console.log(`title / H1 (unchanged): ${before.title}`);

const fields = [
  ['metaTitle', before.metaTitle, metaTitle],
  ['metaDescription', before.metaDescription, metaDescription],
  ['quickAnswer', before.quickAnswer, quickAnswer],
];
for (const [name, was, now] of fields) {
  console.log(`\n--- ${name} ---`);
  console.log(`  was (${was.length}): ${was}`);
  console.log(`  now (${now.length}): ${now}`);
}

console.log(`\n--- content ---`);
console.log(`  was: ${words(before.content)} words, ${(before.content.match(/<h2/g) || []).length} h2, ${(before.content.match(/<table/g) || []).length} table`);
console.log(`  now: ${words(content)} words, ${(content.match(/<h2/g) || []).length} h2, ${(content.match(/<table/g) || []).length} table`);
console.log(`\n  h2 was: ${[...before.content.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => m[1]).join(' | ')}`);
console.log(`  h2 now: ${[...content.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => m[1]).join(' | ')}`);

console.log(`\n--- faqs ---`);
console.log(`  was: ${before.faqs.length}, question-shaped ${before.faqs.filter((f) => /\?/.test(f.question)).length}`);
console.log(`  now: ${faqs.length}, question-shaped ${faqs.filter((f) => /\?/.test(f.question)).length}`);
faqs.forEach((f, i) => console.log(`   ${i + 1}. ${f.question} (${words(f.answer)}w)`));

console.log(`\n--- link delta ---`);
const links = (s) => [...String(s).matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
const wasL = links(before.content);
const nowL = links(content);
console.log(`  removed: ${wasL.filter((l) => !nowL.includes(l)).join(', ') || 'none'}`);
console.log(`  added:   ${nowL.filter((l) => !wasL.includes(l)).join(', ') || 'none'}`);

console.log(`\n--- stale figure sweep on the new copy ---`);
const all = [metaTitle, metaDescription, quickAnswer, content, ...faqs.map((f) => f.answer)].join(' ');
// "rose from EUR 80" and "still quoting EUR 80" are the deliberate historical
// mentions; anything else matching is a leftover.
const sweep = all.replace(/rose from EUR 80|still quoting EUR 80/g, '');
const stale = [...sweep.matchAll(/AED ?(?:350|355|360|370|380)\b|EUR ?(?:80|40)(?!,|\d)|6 to 12|—/g)].map((m) => m[0]);
console.log(`  ${stale.length ? 'STALE: ' + [...new Set(stale)].join(', ') : 'clean (no AED 350/355/360/370/380, no EUR 80/40, no "6 to 12", no em dash)'}`);

if (APPLY) {
  await blogs.updateOne(
    { _id: before._id },
    { $set: { metaTitle, metaDescription, quickAnswer, content, faqs, updatedAt: new Date() } },
  );
  console.log('\napplied.');
} else {
  console.log('\nnothing written.');
}

await mongoose.disconnect();
