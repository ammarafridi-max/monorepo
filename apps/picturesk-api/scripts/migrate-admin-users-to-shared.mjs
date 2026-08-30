/**
 * One-time migration: move Picturesk staff accounts onto the shared
 * @travel-suite/auth AdminUser model.
 *
 * Two things change, and NOTHING else:
 *   collection  adminusers  ->  admin-users   (the shared model registers as 'admin-user')
 *   field       passwordHash -> password      (the shared schema's field name)
 *
 * Both are bcrypt cost-12 hashes, so no password is reset and nobody has to
 * change anything. Roles are untouched: 'support' is now a valid role in the
 * shared enum.
 *
 * Usage (from apps/picturesk-api). Dry run first, it is the default:
 *   node --env-file=.env.production scripts/migrate-admin-users-to-shared.mjs
 *   node --env-file=.env.production scripts/migrate-admin-users-to-shared.mjs --apply
 *
 * Safe to re-run: it stops if the destination collection already exists, and it
 * copies rather than renames, so the original `adminusers` stays untouched as a
 * rollback. Delete it by hand once admin login is confirmed working.
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
console.log(`[migrate] connected -> ${MONGODB_URI.replace(/:\/\/[^@]+@/, '://***@')}`);
console.log(`[migrate] mode: ${APPLY ? 'APPLY' : 'DRY RUN (pass --apply to write)'}`);

const names = (await db.listCollections().toArray()).map((c) => c.name);
const hasSource = names.includes('adminusers');
const hasDest = names.includes('admin-users');

if (!hasSource) {
  console.log('[migrate] no `adminusers` collection: nothing to migrate.');
  process.exit(0);
}
if (hasDest) {
  const destCount = await db.collection('admin-users').countDocuments();
  console.error(`[migrate] ABORT: \`admin-users\` already exists with ${destCount} document(s).`);
  console.error('[migrate] Refusing to touch it. Inspect it, and drop it by hand if it is a bad partial run.');
  process.exit(1);
}

const docs = await db.collection('adminusers').find({}).toArray();
console.log(`[migrate] found ${docs.length} staff account(s) in \`adminusers\`:`);

const migrated = [];
for (const doc of docs) {
  const { passwordHash, ...rest } = doc;
  if (!passwordHash) {
    console.error(`[migrate] ABORT: ${doc.email} has no passwordHash. Refusing a partial migration.`);
    process.exit(1);
  }
  console.log(`  - ${doc.email} (${doc.username}) role=${doc.role} status=${doc.status}`);
  migrated.push({ ...rest, password: passwordHash });
}

if (!APPLY) {
  console.log('[migrate] dry run complete. Nothing was written. Re-run with --apply.');
  process.exit(0);
}

const result = await db.collection('admin-users').insertMany(migrated, { ordered: true });
console.log(`[migrate] wrote ${result.insertedCount} document(s) to \`admin-users\`.`);

// The shared schema declares these unique; build them now rather than on first write.
await db.collection('admin-users').createIndex({ email: 1 }, { unique: true });
await db.collection('admin-users').createIndex({ username: 1 }, { unique: true });
console.log('[migrate] created unique indexes on email and username.');

console.log('');
console.log('[migrate] DONE. `adminusers` was left in place as a rollback.');
console.log('[migrate] Every admin is signed out (the session cookie is now named `jwt`).');
console.log('[migrate] Confirm login works, then drop `adminusers` by hand.');
process.exit(0);
