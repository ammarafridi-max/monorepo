/**
 * Expands the six quickAnswer blocks under 40 words.
 *
 * The quick answer is what an answer engine lifts, and under about 40 words it
 * is too thin to stand alone as the response. Each rewrite also aligns the
 * figures with what the rest of the site now says: EUR 90, 15 calendar days,
 * the EUR 30,000 insurance minimum, and per-destination funds thresholds.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/expand-short-quick-answers.mjs          # dry run
 *   node --env-file=.env.production scripts/expand-short-quick-answers.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const ANSWERS = {
  'proof-of-accommodation-for-schengen-visa-what-uae-applicants-need':
    "Schengen visa applicants from the UAE have to show where they will sleep every night of the trip. That usually means hotel reservations covering the full stay, a rental confirmation, or a host's invitation letter with a copy of their ID and proof of address. The booking has to match the dates and cities on your itinerary, and consulates do check that the two line up.",

  'bls-international-uae-schengen-visa-application-guide':
    'BLS International is a visa application centre operating in the UAE on behalf of European consulates, Spain among them. Most other Schengen states in the UAE go through VFS Global instead, so check which operator your destination uses before you book. At the centre you submit the documents, pay the consular fee and the service charge, and give biometrics. The consulate, not the centre, decides the visa.',

  'schengen-visa-interview-questions-how-to-prepare-from-the-uae':
    'A Schengen visa interview covers four things: why you are travelling, where you will go and stay, how you are paying for it, and what brings you back to the UAE. Not every applicant is interviewed, and it is more common for first-time applicants or where something in the file needs clarifying. Answers that match the documents you submitted matter far more than polished ones.',

  'single-entry-vs-multiple-entry-schengen-visa-which-one-should-you-get':
    'If you are making one trip into the Schengen area and leaving from it, a single entry visa is enough. Choose multiple entry if you will leave and re-enter, for example a side trip to the UK or Turkiye, or if you travel to Europe several times a year. The consular fee is EUR 90 either way, so multiple entry costs nothing extra when it is granted.',

  'how-long-does-a-schengen-visa-take-to-process-from-dubai':
    'Standard Schengen processing is 15 calendar days from your appointment date, and it is set by the consulate rather than the visa centre. The Visa Code allows that to be extended to 45 days in individual cases where the file needs further examination. July, August, Christmas and Eid are the slowest periods, so apply six to eight weeks before you travel.',

  'schengen-visa-rejection-top-10-reasons-and-how-to-avoid-them':
    "Most Schengen refusals come down to the file, not the applicant. The recurring grounds are incomplete or inconsistent documents, insurance that falls short of the EUR 30,000 minimum or expires before the return date, accommodation that does not cover every night, funds below the destination's threshold, and an itinerary the consulate cannot follow. Nearly all of them are preventable before you submit.",
};

const words = (s) => String(s).split(/\s+/).filter(Boolean).length;

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') { await mongoose.disconnect(); throw new Error(`Expected visawadi, got "${conn.db.databaseName}"`); }
const blogs = conn.db.collection('blogs');

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');
let bad = 0;
for (const [slug, quickAnswer] of Object.entries(ANSWERS)) {
  const b = await blogs.findOne({ slug });
  if (!b) { console.log(`\n${slug}: NOT FOUND`); bad++; continue; }
  const w = words(quickAnswer);
  const ok = w >= 40 && w <= 80 && quickAnswer.length <= 500;
  if (!ok) bad++;
  console.log(`\n${slug}\n  ${words(b.quickAnswer)}w -> ${w}w  (${quickAnswer.length} chars)${ok ? '' : '  *** OUT OF RANGE ***'}`);
  console.log(`  ${quickAnswer}`);
  if (APPLY) await blogs.updateOne({ _id: b._id }, { $set: { quickAnswer, updatedAt: new Date() } });
}

const all = await blogs.find({ status: 'published' }).toArray();
console.log(`\n--- verification ---`);
console.log(`  quickAnswers under 40 words: ${all.filter((b) => words(b.quickAnswer) < 40).length}`);
console.log(`  quickAnswers over 80 words : ${all.filter((b) => words(b.quickAnswer) > 80).length}`);
console.log(`  em dashes in new copy      : ${Object.values(ANSWERS).join(' ').match(/—/g)?.length ?? 0}`);
console.log(`  out of range: ${bad}`);
console.log(APPLY ? '\napplied.' : '\nnothing written.');
await mongoose.disconnect();
