/**
 * Targeted improvements to the six posts whose quick answers were expanded.
 *
 * Everything added here is quoted from the consolidated Visa Code, Regulation
 * (EC) No 810/2009 as amended to 02.02.2020, read from the EUR-Lex PDF on
 * 2026-09-08. Articles used: 15 (travel medical insurance), 23 (decision
 * periods), 24 (validity and entries), 32(1) (grounds for refusal) and
 * Annex II (supporting documents). These specific claims therefore carry a real
 * last-checked date; the rest of each post does not and is not stamped.
 *
 * Two factual corrections rather than additions:
 *   - the processing post invented a 30-day tier. Article 23 has 15 calendar
 *     days, extendable to a maximum of 45. There is no 30.
 *   - the single vs multiple entry post described the multiple-entry cascade
 *     loosely and understated the first rung: Article 24(2) requires three
 *     visas lawfully used in the previous two years, not "one or two".
 *   - the BLS post listed Italy and Greece as BLS countries, which contradicts
 *     VisaWadi's own Italy and Greece pages. Both file through VFS Global.
 *
 * Inserted immediately before the Sources block so it stays above it.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/improve-six-schengen-posts.mjs          # dry run
 *   node --env-file=.env.production scripts/improve-six-schengen-posts.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const CHECKED = '8 September 2026';
const CODE = 'https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:02009R0810-20200202';
const cite = (art) =>
  `<p><em>Source: <a href="${CODE}" target="_blank" rel="noopener noreferrer">Visa Code, Regulation (EC) No 810/2009, ${art}</a>, consolidated to 2 February 2020. Checked ${CHECKED}.</em></p>`;
const MARKER = 'data-block="visacode"';

const SECTIONS = {
  'how-long-does-a-schengen-visa-take-to-process-from-dubai': `<h2>What does the law actually allow?</h2>
<p>The timings are not a consulate convention, they are set in the Visa Code, and knowing the actual limits tells you when a wait has become unusual.</p>
<table>
<thead><tr><th>Situation</th><th>Deadline</th><th>Basis</th></tr></thead>
<tbody>
<tr><td>Standard decision</td><td>15 calendar days from the date the application is lodged</td><td>Article 23(1)</td></tr>
<tr><td>Individual cases needing further scrutiny</td><td>Extended up to a maximum of 45 calendar days</td><td>Article 23(2)</td></tr>
<tr><td>Justified cases of urgency</td><td>Decided without delay</td><td>Article 23(2a)</td></tr>
</tbody>
</table>
<p>There is no 30-day tier, and no consulate can take longer than 45 calendar days on a lodged, admissible application. The clock starts when the file is accepted as admissible, not when you booked the appointment, so an incomplete file that has to be resubmitted restarts it.</p>
${cite('Article 23')}`,

  'single-entry-vs-multiple-entry-schengen-visa-which-one-should-you-get': `<h2>What earns a longer multiple-entry visa?</h2>
<p>The multiple-entry ladder is written into the Visa Code, and the thresholds are specific rather than discretionary. If you meet a rung and the entry conditions, that validity should be issued unless your passport expires sooner.</p>
<table>
<thead><tr><th>Validity granted</th><th>What you must already have</th><th>Basis</th></tr></thead>
<tbody>
<tr><td>1 year</td><td>Three visas obtained and lawfully used within the previous two years</td><td>Article 24(2)(a)</td></tr>
<tr><td>2 years</td><td>A previous one-year multiple-entry visa lawfully used within the previous two years</td><td>Article 24(2)(b)</td></tr>
<tr><td>5 years</td><td>A previous two-year multiple-entry visa lawfully used within the previous three years</td><td>Article 24(2)(c)</td></tr>
</tbody>
</table>
<p>Airport transit visas and visas with limited territorial validity do not count towards the ladder, and no visa may be valid for more than five years. A single-entry visa also carries a 15 calendar day period of grace on top of its validity, which member states may withhold on public policy grounds.</p>
<p>Insurance differs by type too. For a single or two-entry visa the policy must cover the whole intended stay. For a multiple-entry visa it need only cover the first intended visit, and you sign a declaration acknowledging you need cover for later trips.</p>
${cite('Articles 24 and 15')}`,

  'schengen-visa-rejection-top-10-reasons-and-how-to-avoid-them': `<h2>What are the legal grounds for refusal?</h2>
<p>The practical reasons above all map onto a short list in the Visa Code. A refusal notice cites one of these, so it is worth knowing which of them your file is weakest against.</p>
<table>
<thead><tr><th>Ground for refusal</th><th>Article 32(1)</th></tr></thead>
<tbody>
<tr><td>A travel document that is false, counterfeit or forged</td><td>(a)(i)</td></tr>
<tr><td>No justification for the purpose and conditions of the intended stay</td><td>(a)(ii)</td></tr>
<tr><td>No proof of sufficient means of subsistence for the stay and the return</td><td>(a)(iii)</td></tr>
<tr><td>Already stayed 90 days in the current 180-day period</td><td>(a)(iv)</td></tr>
<tr><td>An alert issued in the SIS for the purpose of refusing entry</td><td>(a)(v)</td></tr>
<tr><td>Considered a threat to public policy, internal security or public health</td><td>(a)(vi)</td></tr>
<tr><td>No proof of adequate and valid travel medical insurance, where applicable</td><td>(a)(vii)</td></tr>
<tr><td>Reasonable doubts about the documents, the statements, or your intention to leave</td><td>(b)</td></tr>
</tbody>
</table>
<p>The last one is the broadest and the hardest to answer, because it turns on the consulate's assessment rather than a missing document. It is also why ties to the UAE and a coherent itinerary carry as much weight as the paperwork.</p>
${cite('Article 32(1)')}`,

  'proof-of-accommodation-for-schengen-visa-what-uae-applicants-need': `<h2>What does the Visa Code actually require?</h2>
<p>Annex II of the Visa Code sets out the non-exhaustive list of supporting documents consulates may ask for. For tourism and private visits it names two things under accommodation:</p>
<ul>
<li>An invitation from the host, if you are staying with someone</li>
<li>A document from the establishment providing accommodation, or any other appropriate document indicating the accommodation envisaged</li>
</ul>
<p>Note "non-exhaustive" and "any other appropriate document": the list is a floor, not a ceiling, and individual consulates add their own requirements on top. That is why a booking accepted in Madrid may still be queried in Berlin. The itinerary sits in the same annex, as confirmation of a booked trip or any other appropriate document indicating the envisaged travel plans.</p>
${cite('Annex II, part A')}`,

  'schengen-visa-interview-questions-how-to-prepare-from-the-uae': `<h2>What is the interview actually testing?</h2>
<p>The questions vary, the legal test does not. Article 32(1)(b) of the Visa Code allows a refusal where there are reasonable doubts about the authenticity of your documents, the veracity of their contents, the reliability of your statements, or your intention to leave the territory before the visa expires.</p>
<p>Three of those four are about consistency rather than content. An answer that contradicts your own paperwork damages the file more than an imperfect answer does, which is why the most useful preparation is rereading what you actually submitted rather than rehearsing lines.</p>
<p>The fourth, intention to leave, is what the questions about your job, family and return plans are aimed at. There is no document that proves it outright, so the consulate infers it from everything else in the file.</p>
${cite('Article 32(1)(b)')}`,

  'bls-international-uae-schengen-visa-application-guide': `<h2>How long does the decision take after you submit at BLS?</h2>
<p>The centre collects the file; the consulate decides it. Under Article 23 of the Visa Code the decision is due within 15 calendar days of the application being lodged, extendable to a maximum of 45 calendar days in individual cases needing further scrutiny, and without delay in justified cases of urgency. Nothing BLS offers changes those limits.</p>
${cite('Article 23')}`,
};

const FIXES = {
  'how-long-does-a-schengen-visa-take-to-process-from-dubai': [
    ['In practice, some applications come back faster, while others take closer to 30 days, and in exceptional circumstances up to 45 days.',
     'In practice some come back faster, while others run to the maximum the Visa Code allows, which is 45 calendar days.'],
  ],
  'bls-international-uae-schengen-visa-application-guide': [
    ['Countries that have worked with BLS in the UAE include Spain, Italy, Greece, Portugal, and Malta, among others.',
     'Of the Schengen countries VisaWadi handles, Spain files through BLS International; France, Germany, Italy and Greece go through VFS Global instead.'],
  ],
};

const strip = (h) => String(h).replace(new RegExp(`\\n?<div ${MARKER}>[\\s\\S]*?<\\/div>\\n?`, 'g'), '');

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') { await mongoose.disconnect(); throw new Error(`Expected visawadi, got "${conn.db.databaseName}"`); }
const blogs = conn.db.collection('blogs');

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');
let fails = 0;
for (const [slug, section] of Object.entries(SECTIONS)) {
  const b = await blogs.findOne({ slug });
  if (!b) { console.log(`\n${slug}: NOT FOUND`); fails++; continue; }
  let content = strip(b.content);

  for (const [from, to] of FIXES[slug] || []) {
    if (!content.includes(from)) { console.log(`  ${slug}: FIX MISS "${from.slice(0, 55)}"`); fails++; continue; }
    content = content.replace(from, to);
  }

  const anchor = '\n<div data-block="sources">';
  const wrapped = `\n<div ${MARKER}>\n${section}\n</div>`;
  if (!content.includes(anchor)) { console.log(`  ${slug}: NO SOURCES ANCHOR`); fails++; continue; }
  content = content.replace(anchor, `${wrapped}${anchor}`);

  const before = String(b.content).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const after = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  console.log(`\n${slug}`);
  console.log(`  ${before}w -> ${after}w | tables ${(String(b.content).match(/<table/g) || []).length} -> ${(content.match(/<table/g) || []).length} | fixes ${(FIXES[slug] || []).length}`);
  console.log(`  new h2: ${(section.match(/<h2>([\s\S]*?)<\/h2>/) || [])[1]}`);
  if (APPLY) await blogs.updateOne({ _id: b._id }, { $set: { content, updatedAt: new Date() } });
}

console.log('\n--- verification ---');
const all = await blogs.find({ status: 'published' }).toArray();
console.log(`  posts with a table          : ${all.filter((b) => /<table/.test(b.content)).length} / ${all.length}`);
console.log(`  posts with a last-checked   : ${all.filter((b) => /Checked \d|last checked/i.test(b.content)).length} / ${all.length}`);
console.log(`  stray "30 days" timing left : ${all.filter((b) => /closer to 30 days/.test(b.content)).length}`);
console.log(`  BLS post still lists Italy/Greece as BLS: ${all.some((b) => /BLS in the UAE include Spain, Italy, Greece/.test(b.content))}`);
console.log(`  failures: ${fails}`);
console.log(APPLY ? '\napplied.' : '\nnothing written.');
await mongoose.disconnect();
