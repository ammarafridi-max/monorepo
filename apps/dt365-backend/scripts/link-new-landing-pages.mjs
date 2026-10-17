import mongoose from 'mongoose';
import { writeFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const MAX_LINKS_PER_POST = 2;

const TARGETS = [
  { href: '/verifiable-dummy-ticket', phrases: ['verifiable dummy ticket'] },
  {
    href: '/multi-city-dummy-ticket',
    phrases: ['multi-city dummy ticket', 'multi-city itinerary', 'multi-city reservation'],
  },
  {
    href: '/dummy-ticket-for-visa',
    phrases: ['dummy ticket for a visa application', 'dummy ticket for a visa'],
  },
  { href: '/air-france-dummy-ticket', phrases: ['Air France'] },
];

const META_TRIMS = {
  'flight-reservation-expires-before-visa-approval-heres-what-to-do': {
    metaTitle: 'What If a Flight Reservation Expires Before Visa Approval?',
  },
};

const insideAnchor = (s, i) => s.lastIndexOf('<a ', i) > s.lastIndexOf('</a>', i);
const insideHeading = (s, i) => {
  const open = Math.max(...[1, 2, 3, 4, 5, 6].map((n) => s.lastIndexOf(`<h${n}`, i)));
  const close = Math.max(...[1, 2, 3, 4, 5, 6].map((n) => s.lastIndexOf(`</h${n}>`, i)));
  return open > close;
};

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not set. Run with --env-file.');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
console.log(`connected to database: ${db.databaseName}`);
console.log(APPLY ? 'MODE: APPLY (will write)' : 'MODE: DRY RUN (no writes)');

const col = db.collection('blogs');
const posts = await col.find({ status: 'published' }).toArray();
console.log(`published posts: ${posts.length}\n`);

const planned = [];

for (const post of posts) {
  let content = post.content || '';
  const added = [];

  for (const { href, phrases } of TARGETS) {
    if (added.length >= MAX_LINKS_PER_POST) break;
    if (content.includes(`href="${href}"`)) continue;

    for (const phrase of phrases) {
      const idx = content.toLowerCase().indexOf(phrase.toLowerCase());
      if (idx === -1) continue;
      if (insideAnchor(content, idx) || insideHeading(content, idx)) continue;
      const matched = content.slice(idx, idx + phrase.length);
      content =
        content.slice(0, idx) + `<a href="${href}">${matched}</a>` + content.slice(idx + phrase.length);
      added.push({ href, anchor: matched });
      break;
    }
  }

  const trim = META_TRIMS[post.slug];
  if (!added.length && !trim) continue;

  planned.push({
    _id: post._id,
    slug: post.slug,
    added,
    oldMetaTitle: trim ? post.metaTitle : undefined,
    newMetaTitle: trim ? trim.metaTitle : undefined,
    content: added.length ? content : undefined,
  });
}

console.log(`posts to change: ${planned.length}\n`);
for (const p of planned) {
  console.log(`  ${p.slug}`);
  for (const a of p.added) console.log(`     + link ${a.href}  anchor "${a.anchor}"`);
  if (p.newMetaTitle) {
    console.log(`     ~ metaTitle ${p.oldMetaTitle.length} -> ${p.newMetaTitle.length} chars`);
    console.log(`         old: ${p.oldMetaTitle}`);
    console.log(`         new: ${p.newMetaTitle}`);
  }
}

const totalLinks = planned.reduce((n, p) => n + p.added.length, 0);
console.log(`\ntotal new links: ${totalLinks}`);
console.log(`total meta trims: ${planned.filter((p) => p.newMetaTitle).length}`);

if (!APPLY) {
  console.log('\nDry run only. Re-run with --apply to write.');
  await mongoose.disconnect();
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = `scripts/backup-link-landing-pages-${stamp}.json`;
const ids = planned.map((p) => p._id);
const backup = await col.find({ _id: { $in: ids } }).toArray();
writeFileSync(backupPath, JSON.stringify(backup, null, 2));
console.log(`\nbacked up ${backup.length} documents to ${backupPath}`);

let written = 0;
for (const p of planned) {
  const $set = {};
  if (p.content !== undefined) $set.content = p.content;
  if (p.newMetaTitle !== undefined) $set.metaTitle = p.newMetaTitle;
  const res = await col.updateOne({ _id: p._id }, { $set });
  written += res.modifiedCount;
}
console.log(`documents modified: ${written}`);
await mongoose.disconnect();
