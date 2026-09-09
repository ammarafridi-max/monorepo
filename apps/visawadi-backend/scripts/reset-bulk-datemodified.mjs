/**
 * Undoes the bulk updatedAt touch of 2026-08-23.
 *
 * 26 posts still share that timestamp, which renders as "Updated 23 Aug 2026",
 * ships as dateModified in BlogPosting, and is the sitemap's lastModified.
 * Three freshness signals all claiming the same day for 26 posts, when nothing
 * was edited that day.
 *
 * The last genuine content edit to the migrated set was the cross-brand fix on
 * 2026-08-16 (see fix-cross-brand-blog-content.mjs). Posts published after that
 * keep their publish date instead, so nothing is ever back-dated below it.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/reset-bulk-datemodified.mjs          # dry run
 *   node --env-file=.env.production scripts/reset-bulk-datemodified.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const BULK = 'Sun Aug 23';
const LAST_REAL_EDIT = new Date('2026-08-16T00:00:00.000Z');

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') { await mongoose.disconnect(); throw new Error(`Expected visawadi, got "${conn.db.databaseName}"`); }
const blogs = conn.db.collection('blogs');

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

let n = 0;
for (const b of await blogs.find({}).sort({ slug: 1 }).toArray()) {
  if (!String(b.updatedAt).startsWith(BULK)) continue;
  const published = b.publishedAt || b.createdAt;
  const next = published && new Date(published) > LAST_REAL_EDIT ? new Date(published) : LAST_REAL_EDIT;
  n++;
  console.log(`  ${b.slug.slice(0, 60).padEnd(60)} ${String(b.updatedAt).slice(4, 15)} -> ${next.toISOString().slice(0, 10)}`);
  if (APPLY) await blogs.updateOne({ _id: b._id }, { $set: { updatedAt: next } });
}

console.log(`\n  posts reset: ${n}`);
const left = (await blogs.find({}).toArray()).filter((b) => String(b.updatedAt).startsWith(BULK)).length;
const spread = {};
for (const b of await blogs.find({}).toArray()) {
  const k = String(b.updatedAt).slice(4, 15);
  spread[k] = (spread[k] || 0) + 1;
}
console.log(`  still on the bulk date: ${left}`);
console.log('  updatedAt spread now:', Object.entries(spread).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(', '));
console.log(APPLY ? '\napplied.' : '\nnothing written.');
await mongoose.disconnect();
