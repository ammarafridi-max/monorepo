// Usage: node --env-file=.env.production scripts/seo-meta-rewrite.mjs [--apply]
//
// GSC-driven SERP title rewrite. The post sits at position 10.2 on 1,806
// impressions with 0.72% CTR, and separately ranks page 1 for "dummy ticket
// meaning" (106 impressions, position 4.18) and "what is dummy ticket" (103,
// 4.85) with zero clicks on both. The 26-character title answered neither, so
// it now covers the definition intent as well as the how-it-works intent. Only
// metaTitle and metaDescription change: the H1 comes from `title` and still
// matches the body, and updatedAt is left alone.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes('--apply');

const EDITS = {
  'how-do-dummy-tickets-work': {
    metaTitle: 'What Is a Dummy Ticket and How Does It Work?',
    metaDescription:
      'A dummy ticket is a real flight reservation with a live PNR you have not paid for. How it works, how long it stays valid, and whether embassies accept it.',
  },
};

await mongoose.connect(process.env.MONGO_URI);
const Blog = mongoose.connection.collection('blogs');
const slugs = Object.keys(EDITS);
const posts = await Blog.find({ slug: { $in: slugs } }).toArray();

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = join(__dirname, `seo-meta-backup-${stamp}.json`);
writeFileSync(backup, JSON.stringify(posts, null, 2));
console.log(`backed up ${posts.length} post(s) -> ${backup}\n`);

let failures = 0;
for (const slug of slugs) {
  const p = posts.find((x) => x.slug === slug);
  if (!p) { console.error(`  MISSING ${slug}`); failures++; continue; }
  const e = EDITS[slug];
  if (e.metaTitle.length > 60) { console.error(`  TITLE TOO LONG ${slug}: ${e.metaTitle.length}`); failures++; }
  if (e.metaDescription.length > 160) { console.error(`  DESC TOO LONG ${slug}: ${e.metaDescription.length}`); failures++; }
  console.log(`  ${slug}`);
  console.log(`    title  ${p.metaTitle.length} -> ${e.metaTitle.length}   ${e.metaTitle}`);
  console.log(`    desc   ${p.metaDescription.length} -> ${e.metaDescription.length}`);
  console.log(`    H1 (unchanged): ${p.title}`);
}

if (failures) { console.error(`\n${failures} problem(s). Nothing written.`); await mongoose.disconnect(); process.exit(1); }
if (!APPLY) { console.log('\nDRY RUN. Re-run with --apply to write.'); await mongoose.disconnect(); process.exit(0); }

for (const slug of slugs) {
  const r = await Blog.updateOne({ slug }, { $set: EDITS[slug] });
  console.log(`\nwritten ${slug}: matched ${r.matchedCount}, modified ${r.modifiedCount}`);
}
await mongoose.disconnect();
