/**
 * seed-admin.js — bootstrap the first admin account.
 *
 * Picturesk's admin login needs at least one admin-user to exist. This creates it.
 * Idempotent: if ANY admin account already exists it does nothing, so it is safe
 * to run repeatedly (and in a deploy release step).
 *
 * Usage (from apps/picturesk-backend):
 *   node --env-file=.env.development scripts/seed-admin.js
 *
 * Override the defaults with env (recommended — do NOT ship the default password):
 *   SEED_NAME="Ammar Afridi" SEED_USERNAME=ammaradmin SEED_EMAIL=you@example.com \
 *   SEED_PASSWORD='a-strong-password' node --env-file=.env.development scripts/seed-admin.js
 *
 * Reads MONGODB_URI from the env file you pass with --env-file (same as the server).
 */

import AdminUserSchema from "@travel-suite/auth/schema";
import { connectMongo } from "@travel-suite/picturesk-shared";

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  console.error("[seed-admin] MONGODB_URI is required");
  process.exit(1);
}

const NAME = process.env.SEED_NAME ?? "Super Admin";
const USERNAME = (process.env.SEED_USERNAME ?? "superadmin").toLowerCase();
const EMAIL = (process.env.SEED_EMAIL ?? "admin@picturesk.ai").toLowerCase();
const PASSWORD = process.env.SEED_PASSWORD ?? "ChangeMe123";

if (PASSWORD.length < 8) {
  console.error("[seed-admin] SEED_PASSWORD must be at least 8 characters");
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9._-]{7,49}$/.test(USERNAME)) {
  console.error(
    "[seed-admin] SEED_USERNAME must be 8-50 chars, lowercase letters/numbers/._- (start alphanumeric)",
  );
  process.exit(1);
}

async function seed() {
  const mongoose = await connectMongo(MONGODB_URI);
  console.log(
    `[seed-admin] connected -> ${MONGODB_URI.replace(/:\/\/[^@]+@/, "://***@")}`,
  );

  const AdminUser = mongoose.connection.model("admin-user", AdminUserSchema);

  const existing = await AdminUser.countDocuments();
  if (existing > 0) {
    console.log(
      `[seed-admin] ${existing} admin account(s) already exist -- nothing to do.`,
    );
    process.exit(0);
  }

  // The schema's pre-save hook hashes `password`, so pass the plaintext.
  await AdminUser.create({
    name: NAME,
    username: USERNAME,
    email: EMAIL,
    password: PASSWORD,
    role: "admin",
    status: "ACTIVE",
  });

  console.log("");
  console.log("[seed-admin] first admin created:");
  console.log("  Name     :", NAME);
  console.log("  Username :", USERNAME);
  console.log("  Email    :", EMAIL);
  console.log(
    "  Password :",
    process.env.SEED_PASSWORD ? "(from SEED_PASSWORD)" : PASSWORD,
  );
  console.log("");
  console.log(
    "[seed-admin] Log in at /admin/login, then change the password immediately.",
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed-admin] failed:", err.message);
  process.exit(1);
});
