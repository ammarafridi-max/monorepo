/**
 * Move Picturesk staff accounts onto the shared @travel-suite/auth AdminUser
 * model. Two things change, and NOTHING else:
 *
 *   collection  adminusers   ->  admin-users   (the shared model registers as 'admin-user')
 *   field       passwordHash ->  password      (the shared schema's field name)
 *
 * Both hold the same bcrypt hash, so no password is reset and nobody has to
 * change anything. Roles are untouched: 'support' is a valid role in the shared
 * enum. Everyone is signed out once, because the session cookie is now `jwt`.
 *
 * Idempotent, and handles a half-done migration. Renaming the collection WITHOUT
 * renaming the field is the dangerous middle state: the shared auth service reads
 * `user.password`, gets undefined, and bcrypt throws "Illegal arguments", so
 * every login 500s. This script detects and repairs that.
 *
 * Usage (from apps/picturesk-backend). Dry run is the default:
 *   node --env-file=.env.development scripts/migrate-admin-users-to-shared.mjs
 *   node --env-file=.env.development scripts/migrate-admin-users-to-shared.mjs --apply
 */

import { connectMongo } from '@travel-suite/picturesk-shared';

const APPLY = process.argv.includes('--apply');
const { MONGODB_URI } = process.env;

if (!MONGODB_URI) {
  console.error('[migrate] MONGODB_URI is required');
  process.exit(1);
}

const mongoose = await connectMongo(MONGODB_URI);
const db = mongoose.connection.db;
console.log(`[migrate] connected -> ${db.databaseName}`);
console.log(`[migrate] mode: ${APPLY ? 'APPLY' : 'DRY RUN (pass --apply to write)'}`);

const names = (await db.listCollections().toArray()).map((c) => c.name);
const hasSource = names.includes('adminusers');
const hasDest = names.includes('admin-users');

async function finish(code = 0) {
  await mongoose.disconnect();
  process.exit(code);
}

/** Repair docs that carry the legacy field name, whatever collection they are in. */
async function renameField(collectionName) {
  const col = db.collection(collectionName);
  const stale = await col.countDocuments({ passwordHash: { $exists: true }, password: { $exists: false } });
  const ok = await col.countDocuments({ password: { $exists: true } });
  console.log(`[migrate] \`${collectionName}\`: ${ok} already on \`password\`, ${stale} still on \`passwordHash\``);

  if (!stale) return 0;
  for (const d of await col.find({ passwordHash: { $exists: true }, password: { $exists: false } }).toArray()) {
    console.log(`  - ${d.email} (${d.username}) role=${d.role} status=${d.status}`);
  }
  if (!APPLY) return stale;

  const res = await col.updateMany(
    { passwordHash: { $exists: true }, password: { $exists: false } },
    { $rename: { passwordHash: 'password' } },
  );
  console.log(`[migrate] renamed the field on ${res.modifiedCount} document(s).`);
  return res.modifiedCount;
}

if (!hasSource && !hasDest) {
  console.log('[migrate] no staff collection at all: nothing to do.');
  await finish();
}

// The half-done state: collection renamed, field not. Every login 500s until fixed.
if (hasDest) {
  if (hasSource) {
    console.log('[migrate] BOTH `adminusers` and `admin-users` exist. Only `admin-users` is live;');
    console.log('[migrate] `adminusers` is treated as the rollback copy and left alone.');
  }
  const pending = await renameField('admin-users');
  if (!pending) {
    console.log('[migrate] DONE. Nothing to change: admin login should work.');
  } else if (!APPLY) {
    console.log('[migrate] dry run complete. Nothing was written. Re-run with --apply.');
  } else {
    console.log('');
    console.log('[migrate] DONE. Admin login should work now.');
    console.log('[migrate] Everyone is signed out once (the cookie is `jwt`).');
  }
  await finish();
}

// The untouched state: copy `adminusers` -> `admin-users`, renaming the field.
const docs = await db.collection('adminusers').find({}).toArray();
console.log(`[migrate] found ${docs.length} staff account(s) in \`adminusers\`:`);

const migrated = [];
for (const doc of docs) {
  const { passwordHash, ...rest } = doc;
  if (!passwordHash && !doc.password) {
    console.error(`[migrate] ABORT: ${doc.email} has no password hash. Refusing a partial migration.`);
    await finish(1);
  }
  console.log(`  - ${doc.email} (${doc.username}) role=${doc.role} status=${doc.status}`);
  migrated.push({ ...rest, password: passwordHash ?? doc.password });
}

if (!APPLY) {
  console.log('[migrate] dry run complete. Nothing was written. Re-run with --apply.');
  await finish();
}

const result = await db.collection('admin-users').insertMany(migrated, { ordered: true });
console.log(`[migrate] wrote ${result.insertedCount} document(s) to \`admin-users\`.`);

// The shared schema declares these unique; build them now rather than on first write.
await db.collection('admin-users').createIndex({ email: 1 }, { unique: true });
await db.collection('admin-users').createIndex({ username: 1 }, { unique: true });
console.log('[migrate] created unique indexes on email and username.');

console.log('');
console.log('[migrate] DONE. `adminusers` was left in place as a rollback.');
console.log('[migrate] Everyone is signed out once (the cookie is `jwt`).');
console.log('[migrate] Confirm login works, then drop `adminusers` by hand.');
await finish();
