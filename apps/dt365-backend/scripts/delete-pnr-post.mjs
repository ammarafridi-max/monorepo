/**
 * Usage: node --env-file=.env.production scripts/delete-pnr-post.mjs [--apply]
 *
 * Deletes the PNR explainer, which draws 53% of site impressions at 0.12% CTR
 * from Indian Railways PNR-status intent. Writes the full document to JSON
 * before removing it, so it can be restored. Dry run unless --apply.
 */
import mongoose from 'mongoose';
import { writeFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const SLUG = 'what-is-a-pnr-in-flight-reservations-and-how-does-it-work';

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not set. Run with --env-file.');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
console.log(`connected to database: ${db.databaseName}`);
console.log(APPLY ? 'MODE: APPLY (will delete)' : 'MODE: DRY RUN (no writes)');

const col = db.collection('blogs');
const post = await col.findOne({ slug: SLUG });

if (!post) {
  console.log('post not found, nothing to do');
  await mongoose.disconnect();
  process.exit(0);
}

const words = String(post.content || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
console.log(`\n  title : ${post.title}`);
console.log(`  slug  : ${post.slug}`);
console.log(`  status: ${post.status}`);
console.log(`  words : ${words}`);

const linkers = await col.countDocuments({ slug: { $ne: SLUG }, content: { $regex: SLUG } });
console.log(`  posts linking to it: ${linkers}`);

if (!APPLY) {
  console.log('\nDry run only. Re-run with --apply to delete.');
  await mongoose.disconnect();
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = `scripts/backup-deleted-pnr-post-${stamp}.json`;
writeFileSync(backupPath, JSON.stringify(post, null, 2));
console.log(`\nbacked up full document to ${backupPath}`);

const res = await col.deleteOne({ _id: post._id });
console.log(`documents deleted: ${res.deletedCount}`);
await mongoose.disconnect();
