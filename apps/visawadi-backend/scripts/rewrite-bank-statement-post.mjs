/**
 * Rewrites the bank statement post around the balance question it ranks for.
 *
 * The post contradicted itself on the only figure that matters: the quick answer
 * said AED 3,000 to 5,000 per week, the body said EUR 50 to 100 per day, which
 * is half that. Neither was sourced, and both understate Spain by more than
 * half; Spain's floor alone is EUR 1,098.90 per person whatever the trip length.
 *
 * Amounts now come from Annex 25 of the Practical Handbook (= Annex 18 of the
 * Visa Code Handbook), the consolidated list of reference amounts Member States
 * notify to the Commission under Article 6(4) of the Schengen Borders Code,
 * version dated 01/04/2026. Converted at EUR/AED 4.269 and CHF/AED 4.54,
 * 8 September 2026.
 *
 * Four H2s are preserved VERBATIM because their anchors already rank (positions
 * 6.0 to 6.9 in GSC): what-type-of-bank-statement-do-you-need,
 * how-much-balance-do-you-need, what-should-the-statement-show and
 * employed-vs-self-employed-applicants. Renaming them would churn the slugs.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/rewrite-bank-statement-post.mjs          # dry run
 *   node --env-file=.env.production scripts/rewrite-bank-statement-post.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const SLUG = 'schengen-visa-bank-statement-requirements-for-uae-residents';
const CHECKED = '8 September 2026';

const SRC_ANNEX = 'https://home-affairs.ec.europa.eu/document/download/7130e21d-c1c8-41fd-9c83-b6fe312d4f5c_en';
const REF_INSURANCE = 'https://www.travl.ae/blog/schengen-visa-travel-insurance-requirements-minimum-coverage-explained';
const REF_TICKET = 'https://www.dummyticket365.com';
const ext = (h, t) => `<a href="${h}" target="_blank" rel="noopener noreferrer">${t}</a>`;

/** Anchors already ranking; the text is load-bearing, not stylistic. */
const KEEP = [
  'What Type of Bank Statement Do You Need?',
  'How Much Balance Do You Need?',
  'What Should the Statement Show?',
  'Employed vs Self-Employed Applicants',
];

const metaTitle = 'Schengen Bank Statement: 3 Months and Balance';
const metaDescription =
  'Schengen embassies want 3 to 6 months of stamped bank statements. The balance you must show runs from EUR 45 a day for Germany to EUR 122.10 for Spain.';

const quickAnswer =
  'There is no single Schengen-wide minimum balance. Each country sets its own reference amount, from EUR 45 a day for Germany to EUR 122.10 a day for Spain, which also has a EUR 1,098.90 floor per person whatever the trip length. For a seven-day trip a UAE applicant needs roughly AED 1,345 to AED 4,690 depending on the destination, plus three to six months of bank-stamped statements. Amounts last checked ' +
  CHECKED + '.';

const TABLE = `<table>
<thead><tr><th>Country</th><th>Official reference amount</th><th>7-day trip, one adult</th></tr></thead>
<tbody>
<tr><td>Spain</td><td>EUR 122.10 per day, minimum EUR 1,098.90 per person regardless of duration</td><td>EUR 1,098.90 (~AED 4,690)</td></tr>
<tr><td>France</td><td>EUR 120 per day with no hotel booking; EUR 65 per day for days a booking covers</td><td>EUR 840 (~AED 3,585) or EUR 455 (~AED 1,940)</td></tr>
<tr><td>Switzerland</td><td>About CHF 100 per day</td><td>CHF 700 (~AED 3,180)</td></tr>
<tr><td>Netherlands</td><td>EUR 55 per person per day</td><td>EUR 385 (~AED 1,645)</td></tr>
<tr><td>Greece</td><td>EUR 50 per person per day, minimum EUR 300 for stays up to 5 days</td><td>EUR 350 (~AED 1,495)</td></tr>
<tr><td>Germany</td><td>No fixed amount; EUR 45 per day if you cannot evidence your circumstances</td><td>EUR 315 (~AED 1,345)</td></tr>
<tr><td>Italy</td><td>Banded: EUR 269.60 total for 1 to 5 days, then EUR 44.93 per day for 6 to 10 days</td><td>EUR 314.51 (~AED 1,345)</td></tr>
</tbody>
</table>`;

const content = `<p>Your bank statement is one of the first things a visa officer looks at. It tells them whether you can fund the trip and whether you are likely to come back. Get it wrong and the application can be refused even when everything else is in order.</p>
<p>This guide covers what UAE residents need to submit, exactly how much balance each consulate expects, and the mistakes that cost people a decision.</p>

<h2>${KEEP[0]}</h2>
<p>You need a statement from your personal account, the one your salary or regular income goes into. Most consulates want three to six months of transaction history, printed and stamped by your bank.</p>
<p>A PDF downloaded from your banking app is usually not accepted on its own. You need a bank-stamped printout from a branch or an official bank letter confirming your account details and balance. Several UAE banks issue a combined statement and letter, so ask yours what format it provides. Spain is explicit on this point and does not accept bank letters or internet statements as proof of funds.</p>
<p>Business accounts are generally not accepted in place of a personal account, even if you are self-employed. Business owners normally submit both, along with a trade licence.</p>

<h2>${KEEP[1]}</h2>
<p>There is no single Schengen-wide figure. Each member state notifies its own reference amount to the European Commission under Article 6(4) of the Schengen Borders Code, and the spread is wide: Germany works to EUR 45 a day, Spain to EUR 122.10. The country you apply to therefore changes the answer more than the length of your trip does.</p>
${TABLE}
<p>Two things in that table catch people out. Spain applies a floor of EUR 1,098.90 per person no matter how short the trip, so a four-day visit needs the same balance as a nine-day one. And France halves its requirement to EUR 65 a day for the nights a hotel booking covers, which means a confirmed reservation materially lowers the balance you have to show.</p>
<p>These are entry thresholds, not targets. A stable balance with regular salary credits reads far better than a large one-time deposit made days before you apply. Officers can see the transaction history, and a sudden top-up followed by no activity is a well-known flag.</p>
<p>Source: ${ext(SRC_ANNEX, 'European Commission, Annex 25 of the Practical Handbook, reference amounts notified by member states')}, version dated 1 April 2026. Amounts last checked ${CHECKED} at EUR/AED 4.269 and CHF/AED 4.54. Consulates revise these, so confirm yours before you apply.</p>

<h2>${KEEP[2]}</h2>
<p>A statement that will pass without questions shows:</p>
<ul>
<li>Your full name exactly as it appears on your passport</li>
<li>Your account number and the bank's name</li>
<li>Three to six months of transaction history</li>
<li>Regular salary or income credits</li>
<li>A consistent positive balance across the whole period</li>
<li>The issue date, which should be within 30 days of your appointment</li>
</ul>
<p>If your statement is in Arabic, most consulates want a certified English translation. Many UAE banks issue bilingual statements as standard, which avoids the cost entirely, so ask before you pay a translator.</p>

<h2>What If You Have Multiple Accounts?</h2>
<p>If your salary lands in one account and your savings sit in another, submit both. It gives a fuller picture and is the easiest way to clear a higher threshold like Spain's. A balance certificate for a fixed deposit or investment account can support the application too, though it does not replace the primary statement.</p>

<h2>${KEEP[3]}</h2>
<p>If you are salaried, your statement should show consistent monthly salary credits, paired with a salary certificate or employment letter from your employer.</p>
<p>If you are self-employed or freelance, the bar is higher. You need to show regular income arriving, ideally backed by invoices, a trade licence and audited accounts. Irregular income is not automatically a refusal, but it has to be compensated for elsewhere in the file.</p>

<h2>What Other Financial Documents Help Your Application?</h2>
<p>If your balance sits near the threshold, supporting documents carry real weight:</p>
<ul>
<li>Salary certificate or employment letter confirming your role and monthly income</li>
<li>Property ownership documents, if you have them</li>
<li>A sponsorship letter with the sponsor's own bank statement attached, if someone else is funding the trip</li>
<li>Pension or investment statements for retired applicants</li>
</ul>
<p>Note that several countries, Spain and Germany among them, will accept a formal guarantee or sponsorship declaration in place of part of the balance. That route has its own paperwork and is worth checking on your consulate's page before you assume it is simpler.</p>

<h2>What Else Does the Embassy Check?</h2>
<p>The statement is one document in a file. Consulates also weigh your travel history, accommodation, itinerary, flight reservation and insurance.</p>
<p>Your insurance must carry at least EUR 30,000 in medical cover, valid across all 29 Schengen countries for the full trip and including repatriation; ${ext(REF_INSURANCE, 'what that minimum actually covers')} is worth understanding before you buy. For the flight, applicants normally submit a verified reservation rather than <a href="/blog/why-buying-a-real-ticket-before-your-visa-is-approved-is-a-risky-move">a paid ticket bought before a decision</a>, carrying a real PNR the consulate can look up, which is what a provider such as ${ext(REF_TICKET, 'Dummy Ticket 365')} issues.</p>
<p>For the full picture, the <a href="/blog/schengen-visa-documents-checklist-for-uae-residents">Schengen visa documents checklist for UAE residents</a> covers every category, and the <a href="/blog/schengen-visa-fees-in-2026-complete-cost-breakdown-for-uae-applicants">2026 fee breakdown</a> sets out what the application itself costs.</p>

<p>Applying from the UAE? <a href="/uae/visa/schengen">VisaWadi's Schengen packages</a> start at AED 299 and include the flight reservation, hotel booking, 9-day travel insurance and a day-by-day itinerary, and we check your financials against the specific consulate's threshold before the file goes in. <a href="/uae/visa/schengen">See how it works</a>.</p>`;

const faqs = [
  {
    question: 'How much bank balance do you need for a Schengen visa?',
    answer:
      'It depends on the country. Member states set their own reference amounts, from EUR 45 a day for Germany to EUR 122.10 a day for Spain, which also applies a EUR 1,098.90 minimum per person regardless of trip length. For a seven-day trip that is roughly AED 1,345 for Germany or Italy and about AED 4,690 for Spain. France drops from EUR 120 to EUR 65 a day for nights covered by a hotel booking.',
  },
  {
    question: 'How many months of bank statements do I need for a Schengen visa?',
    answer:
      'Three to six months is the standard expectation, and six is safer if your income is irregular. The statement should also be recent, generally issued within 30 days of your appointment, and show continuous history rather than a selected period.',
  },
  {
    question: 'Does the bank statement need to be stamped?',
    answer:
      'Yes. A PDF from your banking app is usually not accepted on its own. Consulates want a bank-stamped branch printout or an official bank letter confirming your account and balance. Spain states outright that bank letters and internet statements are not acceptable, so check the format your consulate requires.',
  },
  {
    question: 'What if my bank statement is in Arabic?',
    answer:
      'Most consulates require a certified English translation. Many UAE banks issue bilingual statements as standard, so ask your bank before paying for a translation. The translated version must match the stamped original exactly.',
  },
  {
    question: 'Can I use a joint account bank statement for my Schengen visa?',
    answer:
      'Yes, provided your name appears on the statement. If the account is shared with a spouse, include a marriage certificate so the relationship is clear. If the other holder is funding the trip, add a sponsorship letter and their supporting documents.',
  },
  {
    question: 'Will topping up my account before applying help?',
    answer:
      'No, and it usually hurts. Officers see the full transaction history, and a large deposit shortly before the application followed by no activity is a recognised flag. A steady balance with regular salary credits is more persuasive than a bigger balance that appeared last week.',
  },
];

const words = (s) => String(s).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
}
const blogs = conn.db.collection('blogs');
const before = await blogs.findOne({ slug: SLUG });
if (!before) { await mongoose.disconnect(); throw new Error(`Post not found: ${SLUG}`); }

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');
console.log(`\nslug (unchanged): ${before.slug}\ntitle / H1 (unchanged): ${before.title}`);

for (const [n, was, now] of [['metaTitle', before.metaTitle, metaTitle], ['metaDescription', before.metaDescription, metaDescription], ['quickAnswer', before.quickAnswer, quickAnswer]]) {
  console.log(`\n--- ${n} ---\n  was (${was.length}): ${was}\n  now (${now.length}): ${now}`);
}
console.log(`\n  rendered <title> will be ${metaTitle.length + 11} chars (template adds " | VisaWadi")`);

const oldH2 = [...before.content.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => m[1]);
const newH2 = [...content.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => m[1]);
console.log(`\n--- content ---\n  was: ${words(before.content)} words, ${(before.content.match(/<table/g) || []).length} table\n  now: ${words(content)} words, ${(content.match(/<table/g) || []).length} table`);
console.log('\n--- anchor slugs ---');
const oldSlugs = oldH2.map(slugify), newSlugs = newH2.map(slugify);
const RANKING = ['what-type-of-bank-statement-do-you-need', 'how-much-balance-do-you-need', 'what-should-the-statement-show', 'employed-vs-self-employed-applicants'];
for (const r of RANKING) console.log(`  ${newSlugs.includes(r) ? 'PRESERVED' : '*** LOST ***'}  #${r}`);
console.log(`  dropped: ${oldSlugs.filter((s) => !newSlugs.includes(s)).map((s) => '#' + s).join(', ') || 'none'}`);
console.log(`  added:   ${newSlugs.filter((s) => !oldSlugs.includes(s)).map((s) => '#' + s).join(', ') || 'none'}`);

console.log(`\n--- faqs ---\n  was: ${before.faqs.length}  now: ${faqs.length}, question-shaped ${faqs.filter((f) => /\?/.test(f.question)).length}`);
faqs.forEach((f, i) => console.log(`   ${i + 1}. ${f.question} (${words(f.answer)}w)`));

const links = (s) => [...String(s).matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
console.log(`\n--- link delta ---\n  removed: ${links(before.content).filter((l) => !links(content).includes(l)).join(', ') || 'none'}\n  added:   ${links(content).filter((l) => !links(before.content).includes(l)).join(', ') || 'none'}`);

const all = [metaTitle, metaDescription, quickAnswer, content, ...faqs.map((f) => f.answer)].join(' ');
const bad = [...all.matchAll(/AED ?(?:3,000|5,000|6,000)\b|EUR ?50 to ?EUR ?100|—/g)].map((m) => m[0]);
console.log(`\n--- sweep ---\n  ${bad.length ? 'FOUND: ' + [...new Set(bad)].join(', ') : 'clean (old balance claims and em dashes gone)'}`);
console.log(`  schema limits: metaTitle ${metaTitle.length}/70, metaDescription ${metaDescription.length}/160, quickAnswer ${quickAnswer.length}/500`);

if (APPLY) {
  await blogs.updateOne({ _id: before._id }, { $set: { metaTitle, metaDescription, quickAnswer, content, faqs, updatedAt: new Date() } });
  console.log('\napplied.');
} else { console.log('\nnothing written.'); }
await mongoose.disconnect();
