/**
 * Inserts the Saudi Arabia topics into the VisaWadi schedule and re-dates what
 * follows, so nothing is lost and no two topics share a date.
 *
 * Appending would have put the first Saudi post on 2026-11-18, eleven weeks
 * after the page starts taking paid traffic. These interleave every other day
 * from the start date instead.
 *
 * Usage, from the repo root:
 *   node automations/scripts/add-saudi-topics.mjs           # dry run
 *   node automations/scripts/add-saudi-topics.mjs --apply
 */

import { readFileSync, writeFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const FILE = new URL('../targets/visawadi/topics.json', import.meta.url);
const START = '2026-09-02';
const EVERY = 2;

const SAUDI = [
  { title: 'Do GCC Residents Need a Visa for Saudi Arabia?', length: 'short', slug: 'do-gcc-residents-need-saudi-visa' },
  { title: 'Saudi Tourist eVisa for UAE Residents: Requirements and Cost', length: 'medium', slug: 'saudi-tourist-evisa-uae-residents-requirements-cost' },
  { title: 'Documents You Need for a Saudi eVisa from the UAE', length: 'medium', slug: 'saudi-evisa-documents-from-uae' },
  { title: 'How Long Does the Saudi eVisa Take from the UAE?', length: 'short', slug: 'saudi-evisa-processing-time-uae' },
  { title: 'Can You Perform Umrah on a Saudi Tourist Visa?', length: 'medium', slug: 'umrah-on-saudi-tourist-visa' },
  { title: 'How Long Can You Stay in Saudi Arabia on a Tourist Visa?', length: 'short', slug: 'saudi-tourist-visa-length-of-stay' },
  { title: 'Saudi eVisa Refused: Common Reasons and How to Fix Them', length: 'medium', slug: 'saudi-evisa-refused-reasons' },
  { title: 'Saudi Visa Rules by Profession: What Changed for GCC Residents', length: 'short', slug: 'saudi-visa-profession-rules-gcc-residents' },
  { title: 'Saudi Arabia Entry Requirements for UAE Residence Visa Holders', length: 'medium', slug: 'saudi-entry-requirements-uae-residence-holders' },
  { title: 'Driving to Saudi Arabia from the UAE: Visa and Border Rules', length: 'medium', slug: 'driving-to-saudi-arabia-from-uae-visa-rules' },
];

const topics = JSON.parse(readFileSync(FILE, 'utf8'));
const before = topics.filter((t) => t.date < START);
const rest = topics.filter((t) => t.date >= START);

if (topics.some((t) => /saudi/i.test(t.title))) {
  console.error('Saudi topics are already in the schedule. Nothing to do.');
  process.exit(1);
}

/** Interleave: one Saudi topic every EVERY slots until they run out. */
const merged = [];
const queue = [...SAUDI];
for (let i = 0; rest.length || queue.length; i++) {
  if (queue.length && i % EVERY === 0) merged.push(queue.shift());
  else if (rest.length) merged.push(rest.shift());
}

const day = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const redated = merged.map((t, i) => ({ ...t, date: day(START, i) }));
const out = [...before, ...redated];

const dates = out.map((t) => t.date);
if (new Set(dates).size !== dates.length) throw new Error('duplicate dates produced');
if (out.length !== topics.length + SAUDI.length) throw new Error('topic count changed unexpectedly');

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');
console.log(`  ${topics.length} topics + ${SAUDI.length} Saudi = ${out.length}`);
console.log(`  unchanged before ${START}: ${before.length}`);
console.log(`  last date: ${topics.at(-1).date} -> ${out.at(-1).date}\n`);
for (const t of out.filter((t) => t.date >= START).slice(0, 14)) {
  const mark = /saudi|umrah|gcc/i.test(t.title) ? 'SA ' : '   ';
  console.log(`  ${mark}${t.date} ${t.length.padEnd(6)} ${t.title.slice(0, 62)}`);
}

if (APPLY) {
  writeFileSync(FILE, `${JSON.stringify(out, null, 2)}\n`);
  console.log('\n  topics.json written');
}
