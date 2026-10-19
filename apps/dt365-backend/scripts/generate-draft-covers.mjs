/**
 * Usage: node --env-file=.env.production scripts/generate-draft-covers.mjs [--apply]
 *
 * Generates a Recraft cover for each draft in docs/blog-drafts and uploads it to
 * Cloudinary, writing the resulting secure_url back into the draft JSON. Mirrors
 * the prompt and Recraft settings used by the blog generate-cover endpoint so
 * the covers match the ones made from the admin UI. Dry run unless --apply.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const APPLY = process.argv.includes('--apply');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const DRAFTS = join(ROOT, 'docs/blog-drafts');

const SKIP = new Set(["a","an","the","and","or","but","in","on","at","to","for","of","with","by","from","is","are","was","were","be","been","do","does","did","have","has","had","will","would","can","could","should","may","might","need","how","what","why","when","where","who","which","that","this","these","those","your","my","our","their","its","not","no","nor","so","yet","if","than","as","up","out","about","into","before","after","between","each","more","most","other","some","such","only","too","very","just","guide","complete","explained","tips","checklist","step","steps","vs","comparison","best","top","get","know","actually","practical","residents","expats","applicants"]);

const buildPrompt = (title, excerpt) => {
  const words = `${title} ${excerpt}`
    .replace(/[?:!,]/g, '')
    .replace(/\b\d{4}\b/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !SKIP.has(w.toLowerCase()));
  const subject = words.slice(0, 6).join(' ') || 'travel';
  return `Professional travel photography, ${subject}, editorial style, soft natural light, wide shot, no text, no words, no letters, no watermarks, no labels`;
};

const key = process.env.RECRAFT_API_KEY;
const cloud = process.env.CLOUDINARY_CLOUD_NAME;
const capiKey = process.env.CLOUDINARY_API_KEY;
const csecret = process.env.CLOUDINARY_API_SECRET;
if (!key) { console.error('RECRAFT_API_KEY is not set'); process.exit(1); }
if (!cloud || !capiKey || !csecret) { console.error('Cloudinary credentials are not set'); process.exit(1); }

const files = readdirSync(DRAFTS).filter((f) => f.endsWith('.json')).sort();
console.log(APPLY ? 'MODE: APPLY (will generate and upload)' : 'MODE: DRY RUN (prompts only)');
console.log(`drafts found: ${files.length}\n`);

for (const f of files) {
  const path = join(DRAFTS, f);
  const d = JSON.parse(readFileSync(path, 'utf8'));
  if (d.coverImageUrl) { console.log(`  SKIP ${d.slug}: already has a cover`); continue; }
  const prompt = buildPrompt(d.title, d.excerpt);
  console.log(`  ${d.slug}`);
  console.log(`     ${prompt.slice(0, 140)}`);
  if (!APPLY) continue;

  const r = await fetch('https://external.api.recraft.ai/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      negative_prompt: 'text, words, letters, watermark, label, caption, title, heading, typography, font, signage',
      model: 'recraftv3',
      style: 'realistic_image',
      size: '1820x1024',
    }),
  });
  if (!r.ok) { console.log(`     RECRAFT ERROR ${r.status}: ${(await r.text()).slice(0, 200)}`); continue; }
  const imageUrl = (await r.json())?.data?.[0]?.url;
  if (!imageUrl) { console.log('     Recraft returned no url'); continue; }

  const img = await fetch(imageUrl);
  const buf = Buffer.from(await img.arrayBuffer());

  const ts = Math.floor(Date.now() / 1000);
  const folder = 'dt365/blog';
  const sig = crypto.createHash('sha1').update(`folder=${folder}&timestamp=${ts}${csecret}`).digest('hex');
  const form = new FormData();
  form.append('file', new Blob([buf], { type: 'image/webp' }), 'cover.webp');
  form.append('api_key', capiKey);
  form.append('timestamp', String(ts));
  form.append('folder', folder);
  form.append('signature', sig);

  const up = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body: form });
  const uj = await up.json();
  if (!up.ok || !uj.secure_url) { console.log(`     CLOUDINARY ERROR: ${JSON.stringify(uj).slice(0, 200)}`); continue; }

  d.coverImageUrl = uj.secure_url;
  writeFileSync(path, JSON.stringify(d, null, 2));
  console.log(`     uploaded: ${uj.secure_url.slice(0, 95)}`);
}
