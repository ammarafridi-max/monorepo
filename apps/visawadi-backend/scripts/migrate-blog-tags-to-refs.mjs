/**
 * Converts blogs.tags from tag NAMES to BlogTag references, in place.
 *
 * Tags were stored as plain strings, so renaming a tag orphaned every post
 * carrying it and nothing in the data recorded which BlogTag a post belonged to.
 *
 * blog.schema.js is shared by all four brands, so the code change lands
 * everywhere at once while each database migrates on its own. Run this against
 * a brand BEFORE deploying its backend; a backend on the new schema reading
 * unmigrated string data will fail to cast.
 *
 * Idempotent: posts already holding ObjectIds are skipped. It refuses to write
 * anything if a tag name matches no BlogTag document, because converting that
 * post would silently drop the tag.
 *
 * Usage, from the brand's backend directory:
 *   node --env-file=.env.production scripts/migrate-blog-tags-to-refs.mjs          # dry run
 *   node --env-file=.env.production scripts/migrate-blog-tags-to-refs.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
console.log(`=== ${APPLY ? 'APPLY' : 'DRY RUN'} on database "${db.databaseName}" ===\n`);

const tagDocs = await db.collection('blog-tags').find({}).toArray();
const byName = new Map(tagDocs.map((t) => [t.name, t._id]));
const blogs = await db.collection('blogs').find({}).toArray();

const isOid = (v) => v instanceof mongoose.Types.ObjectId;
let convert = 0, done = 0, orphan = 0;
const ops = [];

for (const b of blogs) {
  const tags = b.tags || [];
  if (tags.length && tags.every(isOid)) { done++; continue; }
  const missing = tags.filter((t) => !isOid(t) && !byName.has(t));
  if (missing.length) {
    orphan++;
    console.log(`  ORPHAN ${b.slug}: ${missing.join(', ')}`);
    continue;
  }
  const next = tags.map((t) => (isOid(t) ? t : byName.get(t)));
  convert++;
  ops.push({ updateOne: { filter: { _id: b._id }, update: { $set: { tags: next } } } });
}

console.log(`  posts              : ${blogs.length}`);
console.log(`  to convert         : ${convert}`);
console.log(`  already references : ${done}`);
console.log(`  blocked by orphans : ${orphan}`);

if (orphan) {
  console.log('\n  refusing to write: create the missing BlogTag docs first.');
} else if (APPLY && ops.length) {
  const res = await db.collection('blogs').bulkWrite(ops);
  console.log(`  modified           : ${res.modifiedCount}`);
}

console.log('\n--- verification ---');
const after = await db.collection('blogs').find({}).toArray();
const strings = after.filter((b) => (b.tags || []).some((t) => typeof t === 'string'));
console.log(`  posts still holding tag strings: ${strings.length}`);
const withTags = after.find((b) => (b.tags || []).length);
if (withTags) {
  const names = await db.collection('blog-tags').find({ _id: { $in: withTags.tags } }).toArray();
  console.log(`  sample ${withTags.slug}: ${withTags.tags.length} refs -> ${JSON.stringify(names.map((n) => n.name))}`);
}
console.log(`  stray tagIds field left over: ${await db.collection('blogs').countDocuments({ tagIds: { $exists: true } })}`);
console.log(APPLY ? '\napplied.' : '\nnothing written.');
await mongoose.disconnect();
