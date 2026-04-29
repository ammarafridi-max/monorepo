/**
 * seed-admin.js — bootstrap the first admin user in this brand's database.
 *
 * Works in both local development (workspace symlink) and production
 * (pnpm deploy / Docker), because @travel-suite/auth is always in node_modules.
 *
 * Usage:
 *   pnpm seed-admin:dev      # reads .env.development
 *   pnpm seed-admin:prod     # reads .env.production
 *
 * Override defaults:
 *   SEED_USERNAME=myadmin01 SEED_EMAIL=me@example.com SEED_PASSWORD=Secret99 pnpm seed-admin:dev
 *
 * Idempotent — exits safely if any admin user already exists.
 */

import mongoose from 'mongoose';
import AdminUserSchema from '@travel-suite/auth/schema';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌  MONGO_URI is not set. Did you run with --env-file?');
  process.exit(1);
}

const NAME     = process.env.SEED_NAME     ?? 'Super Admin';
const USERNAME = process.env.SEED_USERNAME ?? 'superadmin';
const EMAIL    = process.env.SEED_EMAIL    ?? 'admin@example.com';
const PASSWORD = process.env.SEED_PASSWORD ?? 'Admin1234';

async function seed() {
  const conn = await mongoose.createConnection(MONGO_URI).asPromise();
  console.log(`✅  Connected → ${MONGO_URI.replace(/:\/\/[^@]+@/, '://***@')}`);

  const AdminUser = conn.model('admin-user', AdminUserSchema);

  const count = await AdminUser.countDocuments();
  if (count > 0) {
    console.log(`ℹ️   ${count} admin user(s) already exist — nothing to do.`);
    await conn.close();
    return;
  }

  // The AdminUserSchema pre-save hook hashes the password automatically
  await AdminUser.create({ name: NAME, username: USERNAME, email: EMAIL, password: PASSWORD, role: 'admin', status: 'ACTIVE' });

  console.log('');
  console.log('🎉  First admin user created!');
  console.log('    Name     :', NAME);
  console.log('    Username :', USERNAME);
  console.log('    Email    :', EMAIL);
  console.log('    Password :', PASSWORD);
  console.log('');
  console.log('⚠️   Change the password immediately after your first login.');

  await conn.close();
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
