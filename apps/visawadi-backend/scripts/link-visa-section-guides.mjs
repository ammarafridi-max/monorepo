/**
 * Fills sectionGuides on the ten visa pages.
 *
 * All fifty slots were empty, so no money page carried a single contextual link
 * into the blog: the 27-post Schengen cluster fed the money pages and got
 * nothing back. Each slot renders a VisaGuideLink under its section, and only
 * if the target blog is published, so a draft target degrades to no link.
 *
 * Overlays never override sectionGuides (it is in neither SCALARS nor
 * WHOLE_LISTS in resolveForResidence.js), so only the base visas docs are set.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/link-visa-section-guides.mjs          # dry run
 *   node --env-file=.env.production scripts/link-visa-section-guides.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const CHECKLIST = 'schengen-visa-documents-checklist-for-uae-residents';
const FEES = 'schengen-visa-fees-in-2026-complete-cost-breakdown-for-uae-applicants';
const BANK = 'schengen-visa-bank-statement-requirements-for-uae-residents';
const VFS = 'vfs-global-dubai-booking-appointments-and-what-to-expect';
const REJECT = 'schengen-visa-rejection-top-10-reasons-and-how-to-avoid-them';
const APPLY_GUIDE = 'how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide';
const PROCESSING = 'how-long-does-a-schengen-visa-take-to-process-from-dubai';

/** Each country's own guide goes in `process`; that is the slot whose post
 *  most needs the inbound link, and the five country guides are the weakest
 *  pages on the site by position. */
const MAP = {
  schengen: {
    packages: CHECKLIST, process: APPLY_GUIDE, requirements: BANK,
    pricing: FEES, faqs: REJECT,
  },
  'france-visa': {
    packages: CHECKLIST, process: 'france-visa-from-uae-application-process-documents-and-tips',
    requirements: BANK, pricing: FEES, faqs: VFS,
  },
  'germany-visa': {
    packages: CHECKLIST, process: 'germany-visa-from-uae-step-by-step-application-guide',
    requirements: BANK, pricing: FEES, faqs: VFS,
  },
  'italy-visa': {
    packages: CHECKLIST, process: 'italy-visa-from-uae-requirements-and-application-process',
    requirements: BANK, pricing: FEES, faqs: VFS,
  },
  'greece-visa': {
    packages: CHECKLIST, process: 'greece-visa-from-uae-how-to-apply-and-what-to-expect',
    requirements: BANK, pricing: FEES, faqs: VFS,
  },
  'spain-visa': {
    packages: CHECKLIST, process: 'spain-visa-uae-bls-international-process',
    requirements: BANK, pricing: FEES,
    faqs: 'bls-international-uae-schengen-visa-application-guide',
  },
  'united-kingdom': {
    process: 'uk-visa-from-uae-standard-visitor-visa-application-guide',
    requirements: BANK, faqs: 'uk-visa-refusal-reasons-uae-reapply',
  },
  usa: {
    process: 'usa-b1b2-visa-from-uae-complete-application-guide',
    requirements: BANK, faqs: 'usa-visa-interview-at-the-dubai-embassy-questions-and-tips',
  },
  canada: {
    process: 'canada-visa-biometrics-uae', requirements: BANK,
  },
  // No Saudi post exists yet; the generic Schengen guides would be wrong here,
  // so it stays empty rather than carrying a misleading link.
  'saudi-arabia': {},
};

const KEYS = ['packages', 'process', 'requirements', 'pricing', 'faqs'];

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') { await mongoose.disconnect(); throw new Error(`Expected visawadi, got "${conn.db.databaseName}"`); }
const db = conn.db;

const blogs = await db.collection('blogs').find({}, { projection: { slug: 1, status: 1 } }).toArray();
const idBySlug = Object.fromEntries(blogs.map((b) => [b.slug, b._id]));
const statusBySlug = Object.fromEntries(blogs.map((b) => [b.slug, b.status]));

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

let bad = 0, slots = 0;
const inbound = {};
for (const [slug, spec] of Object.entries(MAP)) {
  const visa = await db.collection('visas').findOne({ slug });
  if (!visa) { console.log(`\n${slug}: VISA NOT FOUND`); bad++; continue; }
  const set = {};
  const lines = [];
  for (const key of KEYS) {
    const target = spec[key];
    if (!target) { lines.push(`  ${key.padEnd(13)} -`); continue; }
    if (!idBySlug[target]) { lines.push(`  ${key.padEnd(13)} *** BLOG NOT FOUND: ${target}`); bad++; continue; }
    if (statusBySlug[target] !== 'published') { lines.push(`  ${key.padEnd(13)} *** NOT PUBLISHED: ${target}`); bad++; continue; }
    set[key] = idBySlug[target];
    inbound[target] = (inbound[target] || 0) + 1;
    slots++;
    lines.push(`  ${key.padEnd(13)} ${target}`);
  }
  console.log(`\n/uae/visa/${slug}  (${Object.keys(set).length}/5)`);
  lines.forEach((l) => console.log(l));
  if (APPLY && Object.keys(set).length) {
    await db.collection('visas').updateOne({ _id: visa._id }, { $set: { sectionGuides: set } });
  }
}

console.log(`\n--- totals ---\n  slots filled: ${slots} / 50\n  problems: ${bad}`);
console.log('\n--- new inbound links per post ---');
Object.entries(inbound).sort((a, b) => b[1] - a[1]).forEach(([s, n]) => console.log(`  ${String(n).padStart(2)}x  ${s}`));
console.log(APPLY ? '\napplied.' : '\nnothing written.');
await mongoose.disconnect();
