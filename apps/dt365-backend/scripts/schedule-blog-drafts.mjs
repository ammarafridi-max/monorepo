/**
 * Usage: node --env-file=.env.production scripts/schedule-blog-drafts.mjs [--apply]
 *
 * Inserts the reviewed drafts in docs/blog-drafts as scheduled posts, one every
 * two days. The backend flips a scheduled post to published on the next read of
 * any blog endpoint once scheduledAt has passed, so no cron is needed.
 * Dry run unless --apply.
 */
import mongoose from 'mongoose';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const APPLY = process.argv.includes('--apply');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const DRAFTS = join(ROOT, 'docs/blog-drafts');
const AUTHOR = '69cd18c27895514fa7e0fb6d';
const FIRST = '2026-10-20T05:00:00Z';
const EVERY_DAYS = 2;

// Ordered by the search opportunity each one targets, strongest first.
const ORDER = [
  'dummy-ticket-schengen-visa-from-india',
  'do-filipino-travellers-need-a-return-ticket',
  'dummy-ticket-schengen-visa-from-pakistan',
  'schengen-visa-from-dubai-non-uae-passport',
  'tiket-dummy-for-indonesian-passport-holders',
  'super-visa-flight-itinerary-what-ircc-expects',
  'flight-reservation-for-a-visa-nigerian-passport',
  'us-visa-from-germany-do-you-need-a-flight-booking',
  'onward-tickets-for-residents-in-saudi-arabia',
  'which-countries-do-australians-need-a-visa-for',
];

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not set. Run with --env-file.');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
console.log(`connected to database: ${db.databaseName}`);
console.log(APPLY ? 'MODE: APPLY (will write)' : 'MODE: DRY RUN (no writes)');

const tagDocs = await db.collection('blog-tags').find({}).toArray();
const tagId = new Map(tagDocs.map((t) => [t.name, t._id]));
const blogs = db.collection('blogs');

const plan = [];
for (const [i, slug] of ORDER.entries()) {
  const d = JSON.parse(readFileSync(join(DRAFTS, `${slug}.json`), 'utf8'));
  const when = new Date(Date.parse(FIRST) + i * EVERY_DAYS * 86400000);
  const words = d.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const unknown = (d.tags || []).filter((t) => !tagId.has(t));
  const exists = await blogs.findOne({ slug });
  plan.push({ slug, d, when, words, unknown, exists: !!exists, cover: d.coverImageUrl });
}

console.log('\n  date (UTC)        slug                                        words  tags  cover');
for (const p of plan) {
  console.log(
    `  ${p.when.toISOString().slice(0, 16)}  ${p.slug.slice(0, 42).padEnd(44)} ${String(p.words).padEnd(6)} ${String((p.d.tags || []).length).padEnd(5)} ${p.cover ? 'yes' : 'MISSING'}`,
  );
}

const problems = [];
for (const p of plan) {
  if (p.exists) problems.push(`${p.slug}: a post with this slug already exists`);
  if (p.unknown.length) problems.push(`${p.slug}: unknown tags ${p.unknown.join(', ')}`);
  if (!p.cover) problems.push(`${p.slug}: no coverImageUrl`);
}

if (problems.length) {
  console.log(`\n  BLOCKERS (${problems.length}):`);
  for (const x of problems) console.log(`    ${x}`);
}

if (!APPLY) {
  console.log('\nDry run only. Re-run with --apply once the blockers are cleared.');
  await mongoose.disconnect();
  process.exit(0);
}

if (problems.length) {
  console.error('\nRefusing to write while blockers remain.');
  await mongoose.disconnect();
  process.exit(1);
}

const now = new Date();
let n = 0;
for (const p of plan) {
  const { d } = p;
  await blogs.insertOne({
    title: d.title,
    slug: d.slug,
    content: d.content,
    excerpt: d.excerpt,
    quickAnswer: d.quickAnswer,
    metaTitle: d.metaTitle,
    metaDescription: d.metaDescription,
    faqs: d.faqs,
    tags: (d.tags || []).map((t) => tagId.get(t)),
    coverImageUrl: p.cover,
    author: new mongoose.Types.ObjectId(AUTHOR),
    publisher: new mongoose.Types.ObjectId(AUTHOR),
    status: 'scheduled',
    scheduledAt: p.when,
    publishedAt: null,
    readingTime: Math.max(1, Math.round(p.words / 200)),
    createdAt: now,
    updatedAt: now,
    __v: 0,
  });
  n += 1;
}
console.log(`scheduled posts created: ${n}`);
await mongoose.disconnect();
