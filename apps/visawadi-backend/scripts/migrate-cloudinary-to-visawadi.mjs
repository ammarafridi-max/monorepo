/**
 * Re-home VisaWadi's Cloudinary assets from the travl/ folder into visawadi/.
 *
 * The visa documents were imported from Travl's database and kept their original
 * image URLs, so VisaWadi currently serves hero images out of `travl/visa/...`.
 * Both brands point at the *same* Cloudinary assets, which means:
 *
 *   COPY, NEVER MOVE. A Cloudinary rename would 404 every Travl visa page.
 *
 * So this uploads each asset to a new public_id under visawadi/ (Cloudinary can
 * fetch from a remote URL, and the existing secure_url is one), verifies the copy
 * is fetchable, then repoints the database. Travl's originals are left untouched.
 *
 * Idempotent: an asset already present at the target public_id is reused rather
 * than re-uploaded, and a visa whose heroImageUrl is already under visawadi/ is
 * skipped entirely. Safe to re-run.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/migrate-cloudinary-to-visawadi.mjs          # dry run
 *   node --env-file=.env.production scripts/migrate-cloudinary-to-visawadi.mjs --apply  # execute
 */

import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

const APPLY = process.argv.includes('--apply');
const SOURCE_PREFIX = 'travl/';
const TARGET_PREFIX = 'visawadi/';

const required = ['MONGO_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env: ${missing.join(', ')}. Run with --env-file=.env.production`);
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Pull the public_id out of a Cloudinary delivery URL.
 * .../upload/v1784810874/travl/visa/<id>/<name>.png -> travl/visa/<id>/<name>
 * The version segment and the file extension are both dropped, which is what
 * the Admin API and uploader expect.
 */
function publicIdFromUrl(url) {
  const m = String(url).match(/\/upload\/(?:v\d+\/)?(.+)$/);
  if (!m) return null;
  return m[1].replace(/\.[a-z0-9]+$/i, '');
}

async function resourceExists(publicId) {
  try {
    await cloudinary.api.resource(publicId);
    return true;
  } catch (err) {
    if (err?.error?.http_code === 404 || err?.http_code === 404) return false;
    throw err;
  }
}

async function urlIsFetchable(url) {
  const res = await fetch(url, { method: 'HEAD' });
  return res.ok;
}

async function main() {
  console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  console.log(`database: ${db.databaseName}\n`);

  if (db.databaseName === 'travl') {
    throw new Error('Refusing to run against the travl database. Check MONGO_URI.');
  }

  const visas = db.collection('visas');
  const docs = await visas.find({ heroImageUrl: { $regex: '/travl/' } }).toArray();
  console.log(`visas with a travl/ hero image: ${docs.length}\n`);

  let copied = 0;
  let reused = 0;
  let updated = 0;

  for (const doc of docs) {
    const oldUrl = doc.heroImageUrl;
    const oldId = publicIdFromUrl(oldUrl);
    if (!oldId || !oldId.startsWith(SOURCE_PREFIX)) {
      console.log(`  ${doc.slug}: SKIP (unrecognised URL shape)`);
      continue;
    }
    const newId = TARGET_PREFIX + oldId.slice(SOURCE_PREFIX.length);

    let newUrl;
    if (await resourceExists(newId)) {
      const res = await cloudinary.api.resource(newId);
      newUrl = res.secure_url;
      reused++;
      console.log(`  ${doc.slug}: target already exists, reusing`);
    } else if (!APPLY) {
      console.log(`  ${doc.slug}: would copy`);
      console.log(`      ${oldId}`);
      console.log(`   -> ${newId}`);
      continue;
    } else {
      const res = await cloudinary.uploader.upload(oldUrl, {
        public_id: newId,
        overwrite: false,
        resource_type: 'image',
      });
      newUrl = res.secure_url;
      copied++;
      console.log(`  ${doc.slug}: copied -> ${newId}`);
    }

    if (!(await urlIsFetchable(newUrl))) {
      throw new Error(`Copy for ${doc.slug} is not fetchable at ${newUrl}; database left unchanged.`);
    }

    if (APPLY) {
      await visas.updateOne({ _id: doc._id }, { $set: { heroImageUrl: newUrl } });
      updated++;
      console.log(`      db updated`);
    }
  }

  console.log(`\ncopied=${copied} reused=${reused} dbUpdated=${updated}`);
  if (!APPLY) console.log('Nothing was written. Re-run with --apply.');
  else console.log('Travl originals were not modified or deleted.');

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('FAILED:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
