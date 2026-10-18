/**
 * Usage: node --env-file=.env.production scripts/link-gsc-opportunities.mjs [--apply]
 *
 * Adds the four internal links the GSC review identified, anchoring each on a
 * phrase already present in the post. Dry run unless --apply, and it writes a
 * JSON backup of every document it touches first. Raw driver, so updatedAt is
 * left alone.
 */
import mongoose from 'mongoose';
import { writeFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');

const PLAN = [
  {
    slug: 'flight-reservation-expires-before-visa-approval-heres-what-to-do',
    phrase: 'longer validity',
    href: '/dummy-ticket-14-days',
  },
  {
    slug: 'can-you-use-a-dummy-ticket-for-visa-extensions',
    phrase: 'validity',
    href: '/dummy-ticket-14-days',
  },
  {
    slug: 'visa-dates-dont-match-your-flight-reservation-read-this',
    phrase: 'itinerary',
    href: '/multi-city-dummy-ticket',
  },
];

const insideAnchor = (s, i) => s.lastIndexOf('<a ', i) > s.lastIndexOf('</a>', i);
const insideHeading = (s, i) => /<h[1-6][^>]*>[^<]*$/.test(s.slice(Math.max(0, i - 400), i));

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not set. Run with --env-file.');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
console.log(`connected to database: ${db.databaseName}`);
console.log(APPLY ? 'MODE: APPLY (will write)' : 'MODE: DRY RUN (no writes)');

const col = db.collection('blogs');
const planned = [];

for (const { slug, phrase, href } of PLAN) {
  const post = await col.findOne({ slug });
  if (!post) {
    console.log(`  SKIP ${slug}: not found`);
    continue;
  }
  let content = post.content || '';
  if (content.includes(`href="${href}"`)) {
    console.log(`  SKIP ${slug}: already links to ${href}`);
    continue;
  }
  const idx = content.toLowerCase().indexOf(phrase.toLowerCase());
  if (idx === -1 || insideAnchor(content, idx) || insideHeading(content, idx)) {
    console.log(`  SKIP ${slug}: no usable occurrence of "${phrase}"`);
    continue;
  }
  const matched = content.slice(idx, idx + phrase.length);
  content =
    content.slice(0, idx) + `<a href="${href}">${matched}</a>` + content.slice(idx + phrase.length);
  const context = content
    .slice(Math.max(0, idx - 90), idx + phrase.length + 90)
    .replace(/<[^>]+>/g, '')
    .trim();
  planned.push({ _id: post._id, slug, href, anchor: matched, content, context });
}

console.log(`\nposts to change: ${planned.length}\n`);
for (const p of planned) {
  console.log(`  ${p.slug}`);
  console.log(`     + ${p.href}  anchor "${p.anchor}"`);
  console.log(`     ...${p.context.slice(0, 150)}...`);
}

if (!APPLY) {
  console.log('\nDry run only. Re-run with --apply to write.');
  await mongoose.disconnect();
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = `scripts/backup-gsc-links-${stamp}.json`;
const backup = await col.find({ _id: { $in: planned.map((p) => p._id) } }).toArray();
writeFileSync(backupPath, JSON.stringify(backup, null, 2));
console.log(`\nbacked up ${backup.length} documents to ${backupPath}`);

let written = 0;
for (const p of planned) {
  const res = await col.updateOne({ _id: p._id }, { $set: { content: p.content } });
  written += res.modifiedCount;
}
console.log(`documents modified: ${written}`);
await mongoose.disconnect();
