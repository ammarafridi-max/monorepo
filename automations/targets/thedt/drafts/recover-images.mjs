/**
 * Usage: RECRAFT_API_KEY=... node targets/thedt/drafts/recover-images.mjs --token <jwt> [--dry-run]
 *
 * Replaces the placeholder covers on the imported posts with Recraft images.
 * The import ran without a Recraft key, so fetchCoverImage fell back to picsum
 * and every cover is an unrelated stock photo. This regenerates each one from
 * its own title and PATCHes it in. Recraft bills per image, so it refuses to
 * run without a key rather than quietly falling back to picsum again.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import TARGET from '../config.mjs';
import { fetchCoverImage } from '../../../src/lib/blog-utils.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (n) => {
  const i = process.argv.indexOf(`--${n}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
};
const DRY = process.argv.includes('--dry-run');
const TOKEN = arg('token');

if (!process.env.RECRAFT_API_KEY) {
  console.error('RECRAFT_API_KEY is not set. Without it this would re-upload picsum placeholders.');
  process.exit(1);
}
if (!TOKEN) {
  console.error('A --token is required (admin JWT).');
  process.exit(1);
}

const slugs = readdirSync(HERE)
  .filter((f) => /^\d+-.*\.json$/.test(f))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(HERE, f), 'utf8')));

const listRes = await fetch(`${TARGET.backendUrl}/api/blogs/admin/list?page=1&limit=100`, {
  headers: { Cookie: `jwt=${TOKEN}` },
});
if (!listRes.ok) {
  console.error(`Could not list posts: ${listRes.status}`);
  process.exit(1);
}
const payload = (await listRes.json()).data ?? {};
const listed = Array.isArray(payload) ? payload : (payload.blogs ?? []);
const idBySlug = Object.fromEntries(listed.map((b) => [b.slug, b._id]));

let ok = 0;
let failed = 0;

for (const d of slugs) {
  const id = idBySlug[d.slug];
  if (!id) {
    console.log(`SKIP ${d.slug} (not found on the site)`);
    failed++;
    continue;
  }
  if (DRY) {
    console.log(`would regenerate ${d.slug} (id ${id})`);
    ok++;
    continue;
  }

  try {
    const cover = await fetchCoverImage(d.topic, TARGET);
    if (cover.type === 'image/jpeg' && cover.size < 60000) {
      // picsum returns small jpegs; Recraft returns webp. Guard against a
      // silent fallback quietly reinstating a placeholder.
      throw new Error('cover looks like a picsum fallback, not a Recraft image');
    }
    const form = new FormData();
    form.append('newCoverImage', cover, 'cover.webp');

    const res = await fetch(`${TARGET.backendUrl}/api/blogs/${id}`, {
      method: 'PATCH',
      headers: { Cookie: `jwt=${TOKEN}` },
      body: form,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${res.status} ${body.message ?? ''}`);

    console.log(`ok   ${d.slug}\n       ${body.data?.coverImageUrl ?? '(no url returned)'}`);
    ok++;
  } catch (err) {
    console.log(`FAIL ${d.slug}\n       ${err.message}`);
    failed++;
  }
}

console.log(`\n${ok} covers replaced, ${failed} failed.`);
process.exit(failed ? 1 : 0);
