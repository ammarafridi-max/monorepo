/**
 * Travl is narrowing to travel insurance only, so visa-topic posts do not belong
 * here any more. This removes the leftover visa drafts that were migrated to
 * VisaWadi and left behind, after writing a JSON backup of each one.
 *
 * Insurance posts that merely mention a visa (Schengen insurance requirements,
 * for example) are Travl's own product content and are deliberately kept.
 *
 * Usage, from apps/travl-backend:
 *   node --env-file=.env.production scripts/remove-migrated-visa-drafts.mjs           # dry run
 *   node --env-file=.env.production scripts/remove-migrated-visa-drafts.mjs --apply
 */

import mongoose from 'mongoose';
import { writeFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const BACKUP_DIR = process.argv.find((a) => a.startsWith('--backup-dir='))?.split('=')[1] ?? '.';

// Matched on exact title so a re-run cannot widen its own blast radius.
const TITLES = [
  'What to Do If Your Schengen Visa Is Delayed Past Your Travel Date',
  'Dummy Ticket Providers Compared: What to Look For Before You Buy',
];

if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI. Run with --env-file=.env.production');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'travl') {
  await mongoose.disconnect();
  throw new Error(`Expected the travl database, got "${conn.db.databaseName}"`);
}
const blogs = conn.db.collection('blogs');

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

const targets = await blogs.find({ title: { $in: TITLES } }).toArray();
console.log(`Matched ${targets.length} of ${TITLES.length} titles\n`);

for (const t of targets) {
  console.log(`  ${t.status.padEnd(9)}  ${t.title}`);
  if (t.status === 'published') {
    console.log('    ↳ published, not a draft — skipping to be safe');
  }
}

const removable = targets.filter((t) => t.status !== 'published');
if (!removable.length) {
  console.log('\nNothing to remove.');
} else if (APPLY) {
  const file = `${BACKUP_DIR}/travl-visa-drafts-backup.json`;
  writeFileSync(file, JSON.stringify(removable, null, 2));
  console.log(`\n✓ Backed up ${removable.length} post(s) to ${file}`);
  const res = await blogs.deleteMany({ _id: { $in: removable.map((t) => t._id) } });
  console.log(`✓ Deleted ${res.deletedCount} post(s)`);
} else {
  console.log(`\nWould delete ${removable.length} post(s) after backing them up.`);
}

await mongoose.disconnect();
