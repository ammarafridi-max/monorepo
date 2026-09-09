/**
 * Adds an at-a-glance table to the six Schengen country guides.
 *
 * Every figure is one already verified this session, so nothing here rests on a
 * source I have not read:
 *   fee            EC, "Schengen visa fee increased as of 11 June 2024"
 *   funds          Annex 25 of the Practical Handbook, version 01/04/2026
 *   insurance      Visa Code Art. 15(3)
 *   decision       Visa Code Art. 23(1) and 23(2)
 *
 * The funds row is the reason the table earns its place: it is the only figure
 * that genuinely differs by country, and it is the one prose kept getting
 * wrong. Germany asks EUR 45 a day and Spain EUR 122.10; the posts had been
 * saying "EUR 50 to EUR 100" for all of them.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/add-country-cost-tables.mjs          # dry run
 *   node --env-file=.env.production scripts/add-country-cost-tables.mjs --apply
 *   node --env-file=.env.production scripts/add-country-cost-tables.mjs --remove --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const REMOVE = process.argv.includes('--remove');
const MARKER = 'data-block="at-a-glance"';
const CHECKED = '9 September 2026';
const CODE = 'https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:02009R0810-20200202';
const ANNEX = 'https://home-affairs.ec.europa.eu/document/download/7130e21d-c1c8-41fd-9c83-b6fe312d4f5c_en';

/** Means of subsistence exactly as each state notified it in Annex 25. */
const FUNDS = {
  'france-visa-from-uae-application-process-documents-and-tips':
    ['France', 'EUR 120 per day, or EUR 65 per day for nights a hotel booking covers'],
  'germany-visa-from-uae-step-by-step-application-guide':
    ['Germany', 'No fixed amount; EUR 45 per day where you cannot evidence your circumstances'],
  'italy-visa-from-uae-requirements-and-application-process':
    ['Italy', 'Banded: EUR 269.60 for 1 to 5 days, then EUR 44.93 per day for 6 to 10 days'],
  'greece-visa-from-uae-how-to-apply-and-what-to-expect':
    ['Greece', 'EUR 50 per person per day, minimum EUR 300 for stays up to 5 days'],
  'netherlands-visa-from-uae-documents-and-process-explained':
    ['the Netherlands', 'EUR 55 per person per day'],
  'switzerland-visa-from-uae-requirements-for-schengen-applicants':
    ['Switzerland', 'About CHF 100 per day; CHF 30 for students with a valid card'],
};

const table = (country, funds) => `
<div ${MARKER}>
<h2>What a ${country} application costs and how long it takes</h2>
<table>
<thead><tr><th>Item</th><th>Amount</th><th>Set by</th></tr></thead>
<tbody>
<tr><td>Consular fee, adult</td><td>EUR 90, roughly AED 385</td><td>Common to all 29 Schengen states</td></tr>
<tr><td>Consular fee, child 6 to 11</td><td>EUR 45; under 6 exempt</td><td>Common to all 29 Schengen states</td></tr>
<tr><td>Funds you must show</td><td>${funds}</td><td>${country === 'the Netherlands' ? 'The Netherlands' : country}, notified under the Schengen Borders Code</td></tr>
<tr><td>Travel medical insurance</td><td>Minimum EUR 30,000 cover, valid across all 29 states</td><td>Visa Code, Article 15(3)</td></tr>
<tr><td>Decision</td><td>15 calendar days from lodging, extendable to a maximum of 45</td><td>Visa Code, Article 23</td></tr>
</tbody>
</table>
<p>The visa centre service charge sits on top of the consular fee and is set by the operator, not the consulate.</p>
<p><em>Sources: <a href="${CODE}" target="_blank" rel="noopener noreferrer">Visa Code, Regulation (EC) No 810/2009</a> and <a href="${ANNEX}" target="_blank" rel="noopener noreferrer">Annex 25 of the Practical Handbook</a>, version 1 April 2026. Checked ${CHECKED}.</em></p>
</div>`;

const strip = (h) => String(h).replace(new RegExp(`\\n?<div ${MARKER}>[\\s\\S]*?<\\/div>\\n?`, 'g'), '');

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') { await mongoose.disconnect(); throw new Error(`Expected visawadi, got "${conn.db.databaseName}"`); }
const blogs = conn.db.collection('blogs');

console.log(`=== ${REMOVE ? 'REMOVE' : 'ADD'} ${APPLY ? 'APPLY' : 'DRY RUN'} ===\n`);
let n = 0, missed = 0;
for (const [slug, [country, funds]] of Object.entries(FUNDS)) {
  const b = await blogs.findOne({ slug });
  if (!b) { console.log(`  ${slug}: NOT FOUND`); missed++; continue; }
  const base = strip(b.content);
  const anchor = '\n<div data-block="sources">';
  if (!REMOVE && !base.includes(anchor)) { console.log(`  ${slug}: no sources anchor`); missed++; continue; }
  const next = REMOVE ? base : base.replace(anchor, `${table(country, funds)}${anchor}`);
  if (next === String(b.content)) { console.log(`  ${slug}: unchanged`); continue; }
  n++;
  const words = (s) => s.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  console.log(`  ${slug.slice(0, 56).padEnd(56)} ${words(String(b.content))}w -> ${words(next)}w`);
  console.log(`     funds row: ${funds}`);
  if (APPLY) await blogs.updateOne({ _id: b._id }, { $set: { content: next, updatedAt: new Date() } });
}

console.log(`\n  posts ${REMOVE ? 'stripped' : 'updated'}: ${n} | missed: ${missed}`);
const all = await blogs.find({ status: 'published' }).toArray();
console.log(`  posts with a table: ${all.filter((b) => /<table/.test(b.content)).length} / ${all.length}`);
console.log(`  posts with a verified date: ${all.filter((b) => /Requirements checked|Checked \d|last checked/i.test(b.content)).length} / ${all.length}`);
console.log(APPLY ? '\napplied.' : '\nnothing written.');
await mongoose.disconnect();
