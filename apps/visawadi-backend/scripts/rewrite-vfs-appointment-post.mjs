/**
 * Retargets and corrects the VFS appointment post.
 *
 * Retarget: 165 of the 184 impressions in this post's query cluster are VFS
 * Global's own brand terms ("vfs global dubai", "vfs dubai"), which VisaWadi
 * cannot win and would not convert if it did. The winnable intent is
 * "schengen visa appointment dubai" and its variants, plus "appointment fees
 * for schengen visa", which already sits at position 4.5. The post now leads
 * on those and treats VFS as the operator rather than the subject.
 *
 * Three corrections, each contradicting VisaWadi's own money pages:
 *   - centres given as "Al Twar and Business Bay"; the Schengen centre is Wafi,
 *     which is what the Greece page says and the only location the money pages
 *     name (10 mentions, versus 0 for the other two)
 *   - Spain listed as a VFS country; Spain files through BLS International
 *   - processing "5 to 15 working days"; the money page says 15 calendar days
 *
 * No anchor on this post ranks, so the H2s are rewritten freely.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/rewrite-vfs-appointment-post.mjs          # dry run
 *   node --env-file=.env.production scripts/rewrite-vfs-appointment-post.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const SLUG = 'vfs-global-dubai-booking-appointments-and-what-to-expect';
const CHECKED = '8 September 2026';
const VFS_DE = '146.74';

const REF_INSURANCE = 'https://www.travl.ae/blog/schengen-visa-travel-insurance-requirements-minimum-coverage-explained';
const REF_TICKET = 'https://www.dummyticket365.com';
const SRC_VFS = 'https://visa.vfsglobal.com/one-pager/germany/uae/english/';
const SRC_BLS = 'https://uae.blsspainvisa.com/';
const ext = (h, t) => `<a href="${h}" target="_blank" rel="noopener noreferrer">${t}</a>`;

const metaTitle = 'Schengen Visa Appointment in Dubai: How to Book';
const metaDescription =
  'How to book a Schengen visa appointment in Dubai, which centre handles your country, what the service charge costs and what happens at the counter.';

const quickAnswer =
  'You book a Schengen visa appointment through the centre your destination country uses, not through the consulate. From the UAE that is VFS Global for most Schengen states and BLS International for Spain. Book 6 to 8 weeks ahead, budget a service charge from AED ' +
  VFS_DE + ' on top of the EUR 90 visa fee, and allow 30 to 60 minutes at the counter. Last checked ' + CHECKED + '.';

const TABLE = `<table>
<thead><tr><th>Destination</th><th>Who runs the centre</th><th>What you book under</th></tr></thead>
<tbody>
<tr><td>France</td><td>VFS Global</td><td>A France-Visas reference, created before you book</td></tr>
<tr><td>Germany</td><td>VFS Global</td><td>A completed VIDEX form</td></tr>
<tr><td>Italy</td><td>VFS Global</td><td>A VFS account for the Italian mission</td></tr>
<tr><td>Greece</td><td>VFS Global, Wafi centre in Dubai</td><td>A VFS account for the Greek mission</td></tr>
<tr><td>Spain</td><td>BLS International, not VFS</td><td>A registered BLS account</td></tr>
<tr><td>Other Schengen states</td><td>Usually VFS Global</td><td>Confirm on that consulate's page before booking</td></tr>
</tbody>
</table>`;

const content = `<p>The appointment is where most Schengen applications from the UAE actually go wrong. Not the decision, the appointment: the wrong centre, a slot booked too late, or a document the counter will not accept and will not let you substitute on the day.</p>
<p>Here is how booking works from Dubai and Abu Dhabi, what it costs, and what happens once you are in the building.</p>

<h2>How do you book a Schengen visa appointment in Dubai?</h2>
<p>You book through the visa application centre your destination country uses, not through the consulate. The consulate decides your visa; the centre only collects the file and your biometrics.</p>
<ul>
<li>Work out which country you are applying to. If you are visiting several Schengen states, that is the one where you will spend the most nights.</li>
<li>Create an account on that operator\'s portal for that country, VFS Global or BLS International.</li>
<li>Select a short-stay Schengen visa, type C, for tourism or business.</li>
<li>Choose a slot at the centre serving your emirate.</li>
<li>Pay the service charge when you book. The consular fee is separate and is paid at the counter or online, depending on the mission.</li>
<li>Bring the printed appointment confirmation.</li>
</ul>
<p>Some missions want paperwork finished before the portal will release a slot. France issues a France-Visas reference number first, and Germany expects a completed VIDEX form. Starting the booking without them wastes the attempt.</p>

<h2>Which visa centre handles your Schengen country?</h2>
<p>This is the single most common booking mistake: applying to the wrong operator. Spain is the one that catches people, because it does not use VFS Global at all.</p>
${TABLE}
<p>VFS Global's Dubai Schengen centre operates from Wafi. Centres and counters do move between missions, so confirm the address on your booking confirmation rather than relying on a guide, this one included.</p>

<h2>How much does a Schengen visa appointment cost?</h2>
<p>Two charges, always separate. The consular fee is EUR 90 for adults, roughly AED 385, and EUR 45 for children aged 6 to 11. On top of that the centre charges its own non-refundable service fee: Germany's VFS Global centres in Dubai and Abu Dhabi charge AED ${VFS_DE} per application including taxes, and other missions typically fall between AED 90 and AED 150. Spain's BLS fee is set separately.</p>
<p>Optional extras at the counter, courier return of your passport, SMS tracking and premium lounge access, are charged again on top. None of them speeds up the decision. The full breakdown is in the <a href="/blog/schengen-visa-fees-in-2026-complete-cost-breakdown-for-uae-applicants">2026 Schengen visa cost guide</a>.</p>
<p>Sources: ${ext(SRC_VFS, 'VFS Global, Germany UAE fee page')} and ${ext(SRC_BLS, 'BLS International Spain, UAE')}. Fees last checked ${CHECKED}.</p>

<h2>How far ahead should you book?</h2>
<p>Six to eight weeks before you travel, and earlier for summer, Christmas and Eid, when slots at the busier missions disappear first. Consulates can accept applications up to six months ahead, so there is no penalty for booking early.</p>
<p>If nothing is available, check the other emirate's centre before you give up; Abu Dhabi often has slots when Dubai does not. Leaving it late is also what pushes people into paying for premium appointment services they do not need.</p>

<h2>What documents do you bring to the appointment?</h2>
<p>The centre will not accept an incomplete file, and you will rebook if something is missing. The standard set is:</p>
<ul>
<li>Passport valid at least three months beyond your return, with two blank pages</li>
<li>Completed and signed Schengen application form</li>
<li>Photographs to Schengen specification, which are stricter than a standard passport photo</li>
<li>Emirates ID and UAE residence visa</li>
<li>Flight reservation for the trip</li>
<li>Accommodation for every night of the stay</li>
<li>Travel insurance with at least EUR 30,000 medical cover, valid across all 29 Schengen states</li>
<li>Three to six months of bank-stamped statements</li>
<li>Proof of employment or business ownership</li>
<li>Cover letter setting out the purpose of the trip</li>
</ul>
<p>Two of these have rules worth knowing before you buy anything. Insurance has to cover the whole trip and include repatriation, not just your first destination; ${ext(REF_INSURANCE, 'what the EUR 30,000 minimum actually covers')} explains where policies fall short. And the balance your statements need to show varies by country, from EUR 45 a day for Germany to a EUR 1,098.90 floor for Spain, which the <a href="/blog/schengen-visa-bank-statement-requirements-for-uae-residents">bank statement guide</a> breaks down.</p>
<p>For the flight, applicants normally submit a verified reservation rather than <a href="/blog/why-buying-a-real-ticket-before-your-visa-is-approved-is-a-risky-move">a paid ticket bought before a decision</a>. The centre checks that it carries a real PNR the airline system can confirm, which is what a provider such as ${ext(REF_TICKET, 'Dummy Ticket 365')} issues. The <a href="/blog/schengen-visa-documents-checklist-for-uae-residents">full documents checklist</a> covers every category.</p>

<h2>What happens on the day?</h2>
<p>Arrive a little before your slot. You check in at reception, a member of staff reviews the file, and if it is complete you submit it, pay anything outstanding and give biometrics: ten fingerprints and a photograph. Biometrics are reused for 59 months, so if you have applied for a Schengen visa recently you may not need to give them again.</p>
<p>Budget 30 to 60 minutes, longer in peak season. You leave with a tracking reference. Standard processing is 15 calendar days from the appointment date, set by the consulate rather than the centre, and no package or premium service shortens it. See <a href="/blog/how-long-does-a-schengen-visa-take-to-process-from-dubai">how long a Schengen visa takes from Dubai</a> for the seasonal picture.</p>

<h2>Why do applications get turned away at the counter?</h2>
<p>The centre does not refuse visas, the consulate does. What the centre does is reject an incomplete submission on the spot, which costs you the slot and the service fee. The recurring causes are insurance that does not meet the EUR 30,000 minimum or expires before the return date, no flight reservation, bank statements short of the destination\'s threshold, photographs at the wrong dimensions, and an unsigned form.</p>
<p>All five are preventable in advance, which is the entire argument for checking the file before you book rather than after. For what drives an actual refusal once the consulate has the file, see the <a href="/blog/schengen-visa-rejection-top-10-reasons-and-how-to-avoid-them">top 10 reasons Schengen visas get rejected</a>.</p>

<p>Applying from the UAE? <a href="/uae/visa/schengen">VisaWadi's Schengen packages</a> start at AED 299, include the flight reservation, hotel booking, 9-day travel insurance and a day-by-day itinerary, and we book the slot at the right centre and check the file against that consulate's requirements before it goes in. <a href="/uae/visa/schengen">See how it works</a>.</p>`;

const faqs = [
  {
    question: 'How do I book a Schengen visa appointment in Dubai?',
    answer:
      'Book through the visa application centre your destination country uses, not the consulate. That is VFS Global for most Schengen states and BLS International for Spain. Create an account on that operator\'s portal, select a short-stay type C visa, choose a slot and pay the service charge. France requires a France-Visas reference and Germany a completed VIDEX form before a slot is released.',
  },
  {
    question: 'How much does a Schengen visa appointment cost from the UAE?',
    answer:
      `Two separate charges. The consular fee is EUR 90 for adults, roughly AED 385, and EUR 45 for children aged 6 to 11. The centre then charges its own non-refundable service fee: Germany's VFS Global centres in Dubai and Abu Dhabi charge AED ${VFS_DE} including taxes, and other missions are typically AED 90 to AED 150. Courier, SMS and lounge add-ons cost extra and do not speed up the decision.`,
  },
  {
    question: 'Does Spain use VFS Global in Dubai?',
    answer:
      'No. Spain files through BLS International, not VFS Global, and you need a registered BLS account to book. Applying to the wrong operator is one of the most common booking mistakes for UAE applicants, because most other Schengen states in the UAE do go through VFS Global.',
  },
  {
    question: 'How far in advance should I book my Schengen appointment?',
    answer:
      'Six to eight weeks before travel, and earlier for summer, Christmas and Eid when slots go first. Consulates accept applications up to six months ahead, so booking early costs nothing. If your emirate has no slots, check the other one before paying for a premium appointment service.',
  },
  {
    question: 'How long does the appointment take?',
    answer:
      'Usually 30 to 60 minutes, longer in peak season. You check in, staff review the file, you submit, pay anything outstanding and give biometrics. Fingerprints are reused for 59 months, so a recent Schengen application may exempt you from giving them again.',
  },
  {
    question: 'What happens if my documents are incomplete?',
    answer:
      'The centre will not accept the submission and you rebook, losing the slot and the service fee. The usual causes are insurance below the EUR 30,000 minimum or expiring too early, a missing flight reservation, bank statements under the destination\'s threshold, wrong photo dimensions and an unsigned form.',
  },
];

const words = (s) => String(s).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') { await mongoose.disconnect(); throw new Error(`Expected visawadi, got "${conn.db.databaseName}"`); }
const blogs = conn.db.collection('blogs');
const before = await blogs.findOne({ slug: SLUG });
if (!before) { await mongoose.disconnect(); throw new Error(`Post not found: ${SLUG}`); }

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');
console.log(`\nslug (unchanged): ${before.slug}\ntitle / H1 (unchanged): ${before.title}`);
for (const [n, was, now] of [['metaTitle', before.metaTitle, metaTitle], ['metaDescription', before.metaDescription, metaDescription], ['quickAnswer', before.quickAnswer, quickAnswer]])
  console.log(`\n--- ${n} ---\n  was (${was.length}): ${was}\n  now (${now.length}): ${now}`);
console.log(`\n  rendered <title>: ${metaTitle.length + 11} chars`);
console.log(`\n--- content ---\n  was: ${words(before.content)} words, ${(before.content.match(/<table/g) || []).length} table\n  now: ${words(content)} words, ${(content.match(/<table/g) || []).length} table`);
console.log(`\n  h2 now: ${[...content.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => m[1]).join(' | ')}`);
console.log(`\n--- faqs ---\n  was ${before.faqs.length} -> now ${faqs.length}, question-shaped ${faqs.filter((f) => /\?/.test(f.question)).length}`);
const links = (s) => [...String(s).matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
console.log(`\n--- link delta ---\n  removed: ${[...new Set(links(before.content).filter((l) => !links(content).includes(l)))].join(', ') || 'none'}\n  added:   ${[...new Set(links(content).filter((l) => !links(before.content).includes(l)))].join(', ') || 'none'}`);

const all = [metaTitle, metaDescription, quickAnswer, content, ...faqs.map((f) => f.answer)].join(' ');
console.log('\n--- corrections check ---');
for (const [label, re] of [['"Al Twar" gone', /Al Twar/], ['"Business Bay" gone', /Business Bay/], ['"5 to 15 working days" gone', /5 (?:and|to) 15 working days/]])
  console.log(`  ${re.test(all) ? '*** STILL PRESENT ***' : 'ok'}  ${label}`);
// Assert the correct attribution rather than trying to prove a negative; the
// FAQ legitimately contains the string "Does Spain use VFS Global".
console.log(`  ${/Spain files through BLS International, not VFS/.test(all) ? 'ok' : '*** MISSING ***'}  Spain attributed to BLS`);
console.log(`  ${/Spain<\/td><td>BLS International, not VFS/.test(all) ? 'ok' : '*** MISSING ***'}  Spain row in table says BLS`);
console.log(`  ok  Wafi named: ${/Wafi/.test(all)}`);
console.log(`  ok  15 calendar days: ${/15 calendar days/.test(all)}`);
console.log(`  curly apostrophes: ${(all.match(/\u2019/g) || []).length}`);
console.log(`  em dashes / mdash entities: ${(all.match(/—|&mdash;/g) || []).length}`);
console.log(`  schema limits: metaTitle ${metaTitle.length}/70, metaDescription ${metaDescription.length}/160, quickAnswer ${quickAnswer.length}/500`);

if (APPLY) {
  await blogs.updateOne({ _id: before._id }, { $set: { metaTitle, metaDescription, quickAnswer, content, faqs, updatedAt: new Date() } });
  console.log('\napplied.');
} else console.log('\nnothing written.');
await mongoose.disconnect();
