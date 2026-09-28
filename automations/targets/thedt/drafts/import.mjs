/**
 * Usage: node targets/thedt/drafts/import.mjs --token <jwt> [--dry-run] [--start 2026-09-29]
 *
 * Posts the hand-written drafts to the live blog API as scheduled posts, using
 * the same FormData shape blog-generate uses, so an imported post is
 * indistinguishable from a generated one: ctaBlock appended to the body, tags
 * by name, cover image uploaded as a file.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import TARGET from '../config.mjs';
import { fetchCoverImage } from '../../../src/lib/blog-utils.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
};
const DRY = process.argv.includes('--dry-run');
const TOKEN = arg('token');
const EVERY_DAYS = Number(arg('every') ?? 3);
/** 05:00 UTC is 09:00 in Dubai, matching blogSchedule.start. */
const START = new Date(`${arg('start') ?? '2026-09-29'}T05:00:00Z`);

if (!TOKEN && !DRY) {
  console.error('A --token is required (admin JWT). Use --dry-run to preview without it.');
  process.exit(1);
}

const drafts = readdirSync(HERE)
  .filter((f) => /^\d+-.*\.json$/.test(f))
  .sort()
  .map((f) => ({ file: f, ...JSON.parse(readFileSync(join(HERE, f), 'utf8')) }));

const slotFor = (i) => new Date(START.getTime() + i * EVERY_DAYS * 86400000);

console.log(`${drafts.length} drafts, one every ${EVERY_DAYS} days from ${START.toISOString()}\n`);

let ok = 0;
let failed = 0;

for (const [i, d] of drafts.entries()) {
  const scheduledAt = slotFor(i);
  const label = `${d.slug} -> ${scheduledAt.toISOString()}`;

  if (scheduledAt <= new Date()) {
    console.log(`SKIP ${label} (in the past; the API rejects these)`);
    failed++;
    continue;
  }

  if (DRY) {
    console.log(`would post  ${label}  [${(d.tags ?? []).join(', ')}]`);
    ok++;
    continue;
  }

  try {
    const cover = await fetchCoverImage(d.topic, TARGET);
    const form = new FormData();
    form.append('title', d.topic);
    form.append('slug', d.slug);
    // The schema has no ctaBlock field; blog-generate appends it to the body.
    form.append('content', `${d.content}\n${d.ctaBlock}`);
    form.append('excerpt', d.excerpt);
    form.append('quickAnswer', d.quickAnswer);
    form.append('metaTitle', d.metaTitle);
    form.append('metaDescription', d.metaDescription);
    form.append('status', 'scheduled');
    form.append('scheduledAt', scheduledAt.toISOString());
    form.append('faqs', JSON.stringify(d.faqs));
    form.append('coverImage', cover, 'cover.jpg');
    for (const tag of d.tags ?? []) form.append('tags[]', tag);

    const res = await fetch(`${TARGET.backendUrl}/api/blogs`, {
      method: 'POST',
      headers: { Cookie: `jwt=${TOKEN}` },
      body: form,
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${res.status} ${body.message ?? JSON.stringify(body).slice(0, 160)}`);

    console.log(`ok   ${label}  id=${body.data?._id ?? '?'}`);
    ok++;
  } catch (err) {
    console.log(`FAIL ${label}\n       ${err.message}`);
    failed++;
  }
}

console.log(`\n${ok} scheduled, ${failed} failed.`);
process.exit(failed ? 1 : 0);
