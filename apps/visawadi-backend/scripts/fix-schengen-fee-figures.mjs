/**
 * Corrects the Schengen consular fee wherever it is still stated wrongly.
 *
 * update-schengen-visa-fee.mjs only rewrites `content`, so every figure sitting
 * in `quickAnswer` or `faqs[].answer` survived it; that is where three of these
 * four live. This one rewrites all three fields and verifies across all three.
 *
 * EUR 90 for adults and EUR 45 for children aged 6 to 11 since 11 June 2024.
 * EUR 90 at EUR/AED 4.269 (8 September 2026) is AED 384, so AED 385, matching
 * every Schengen money page and the fees post.
 *
 * Source: European Commission, "Schengen visa fee increased as of 11 June 2024".
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/fix-schengen-fee-figures.mjs          # dry run
 *   node --env-file=.env.production scripts/fix-schengen-fee-figures.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const EDITS = {
  'italy-visa-from-uae-requirements-and-application-process': {
    faqs: [['EUR 90 for adults (around AED 350)', 'EUR 90 for adults (around AED 385)']],
  },
  'switzerland-visa-from-uae-requirements-for-schengen-applicants': {
    faqs: [['EUR 90 (approximately AED 360)', 'EUR 90 (approximately AED 385)']],
  },
  'netherlands-visa-from-uae-documents-and-process-explained': {
    faqs: [[
      'EUR 90 for adults (approximately AED 360 at current rates)',
      'EUR 90 for adults (approximately AED 385 at current rates)',
    ]],
  },
  'spain-visa-uae-bls-international-process': {
    content: [
      ['EUR 80, payable at BLS in AED equivalent', 'EUR 90, payable at BLS in AED equivalent (roughly AED 385)'],
      ['<tr><td>Visa fee (children 6–11)</td><td>EUR 40</td></tr>', '<tr><td>Visa fee (children 6–11)</td><td>EUR 45</td></tr>'],
      ['<td>EUR 80 (payable in AED at the counter rate)</td>', '<td>EUR 90 (payable in AED at the counter rate, roughly AED 385)</td>'],
      ['<tr><td>Schengen visa fee (child 6–11)</td><td>EUR 40</td></tr>', '<tr><td>Schengen visa fee (child 6–11)</td><td>EUR 45</td></tr>'],
      ['The EUR 80 embassy fee is a pass-through cost', 'The EUR 90 embassy fee is a pass-through cost'],
    ],
    faqs: [[
      'EUR 80 for adult applicants and EUR 40 for children aged 6 to 11',
      'EUR 90 for adult applicants and EUR 45 for children aged 6 to 11',
    ]],
  },
};

/** China's AED 270-500 band is its own consular fee, not a Schengen figure, and
 *  must not be swept into the Schengen correction. */
const NOT_SCHENGEN = new Set(['china-visa-from-uae-tourist-visa-application-process']);

// \b(?!,\d) keeps "EUR 80," (a real hit) while excluding "EUR 30,000" style
// insurance-coverage figures. A bare (?!,) misses the comma case entirely.
const STALE = /AED ?(?:350|355|360|370|380)\b|EUR ?(?:80|40)\b(?!,\d)/g;

/** The fees post states the old fee on purpose, to date-stamp guides that still
 *  quote it. Exempt those two phrasings rather than the whole post. */
const HISTORICAL = /(?:rose from|still quoting) EUR 80/g;

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
}
const blogs = conn.db.collection('blogs');

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

let failed = 0;
for (const [slug, spec] of Object.entries(EDITS)) {
  const b = await blogs.findOne({ slug });
  if (!b) { console.log(`\n${slug}: NOT FOUND`); failed++; continue; }
  console.log(`\n${slug}`);
  const set = {};

  for (const [from, to] of spec.content || []) {
    if (!String(b.content).includes(from)) { console.log(`  content MISS  "${from.slice(0, 60)}"`); failed++; continue; }
    set.content = String(set.content ?? b.content).split(from).join(to);
    console.log(`  content  ${from.slice(0, 62)}\n        -> ${to.slice(0, 62)}`);
  }

  for (const [from, to] of spec.faqs || []) {
    const faqs = (set.faqs ?? b.faqs).map((f) => ({ ...f }));
    const hit = faqs.find((f) => String(f.answer).includes(from));
    if (!hit) { console.log(`  faqs    MISS  "${from.slice(0, 60)}"`); failed++; continue; }
    hit.answer = String(hit.answer).split(from).join(to);
    set.faqs = faqs;
    console.log(`  faqs[${faqs.indexOf(hit)}] ${from.slice(0, 62)}\n        -> ${to.slice(0, 62)}`);
  }

  for (const [from, to] of spec.quickAnswer || []) {
    if (!String(b.quickAnswer).includes(from)) { console.log(`  quickAnswer MISS "${from.slice(0, 55)}"`); failed++; continue; }
    set.quickAnswer = String(set.quickAnswer ?? b.quickAnswer).split(from).join(to);
    console.log(`  quickAnswer -> ${to.slice(0, 62)}`);
  }

  if (APPLY && Object.keys(set).length) {
    await blogs.updateOne({ _id: b._id }, { $set: { ...set, updatedAt: new Date() } });
  }
}

console.log('\n=== verification: content + quickAnswer + faqs, every post ===');
let stale = 0;
for (const b of await blogs.find({}).toArray()) {
  if (NOT_SCHENGEN.has(b.slug)) continue;
  const fields = [['content', b.content], ['quickAnswer', b.quickAnswer]]
    .concat((b.faqs || []).map((f, i) => [`faqs[${i}]`, f.answer]));
  for (const [name, val] of fields) {
    const scrubbed = String(val || '').replace(HISTORICAL, (h) => '_'.repeat(h.length));
    for (const m of scrubbed.matchAll(STALE)) {
      stale++;
      const s = String(val);
      console.log(`  STALE ${b.slug} [${name}] ...${s.slice(Math.max(0, m.index - 70), m.index + m[0].length + 50).replace(/\s+/g, ' ')}...`);
    }
  }
}
console.log(`  stale references remaining: ${stale}`);
console.log(`  literals that failed to match: ${failed}`);
console.log(APPLY ? '\napplied.' : '\nnothing written.');

await mongoose.disconnect();
