/* eslint-disable no-console */
/**
 * Usage, from any backend workspace (the same script serves every brand):
 *   pnpm seed-admin -- --email you@brand.com --name "Your Name" --username your.name --password '...' [--role admin]
 *   pnpm seed-admin -- --email you@brand.com --password '...' --reset-password   # existing account, new password
 *
 * Connects with MONGO_URI (travel backends) or MONGODB_URI (Picturesk), which the
 * backend's `seed-admin` script loads from its .env.production. Creates the account
 * through the shared AdminUser schema so the password is hashed by its pre-save hook.
 */
import mongoose from 'mongoose';
import AdminUserSchema from '../../auth/src/schema.js';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, all) => {
    if (arg.startsWith('--')) acc.push([arg.slice(2), all[i + 1]?.startsWith('--') || all[i + 1] === undefined ? true : all[i + 1]]);
    return acc;
  }, []),
);

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) {
  console.error('Set MONGO_URI (or MONGODB_URI) in the environment.');
  process.exit(2);
}
if (!args.email || !args.password) {
  console.error('Usage: seed-admin --email <email> --password <password> [--name <name>] [--username <username>] [--role admin|agent|blog-manager|support] [--reset-password]');
  process.exit(2);
}

await mongoose.connect(uri);
const AdminUser = mongoose.models['admin-user'] || mongoose.model('admin-user', AdminUserSchema);
const email = String(args.email).toLowerCase().trim();

try {
  const existing = await AdminUser.findOne({ email }).select('+password');
  if (existing && !args['reset-password']) {
    console.error(`${email} already exists (username ${existing.username}, role ${existing.role}). Pass --reset-password to set a new password.`);
    process.exit(1);
  }

  if (existing) {
    existing.password = args.password;
    existing.status = 'ACTIVE';
    await existing.save();
    console.log(`Password reset for ${email}.`);
  } else {
    const username = args.username || email.split('@')[0].replace(/[^a-z0-9._-]/g, '.').padEnd(8, '0');
    const user = await AdminUser.create({
      name: args.name || email.split('@')[0],
      username,
      email,
      password: args.password,
      role: args.role || 'admin',
      status: 'ACTIVE',
    });
    console.log(`Created ${user.role} ${user.email} (username ${user.username}).`);
  }
} finally {
  await mongoose.disconnect();
}
