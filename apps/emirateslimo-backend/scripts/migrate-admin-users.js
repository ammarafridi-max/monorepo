/* eslint-disable no-console */
/**
 * One-time cutover: the standalone backend stored admin/agent accounts in the
 * `users` collection (model "User"). The shared @travel-suite/auth model
 * registers as "admin-user" → collection `admin-users`. This copies each
 * document 1:1 (preserving _id, bcrypt password hash, role, status) so existing
 * logins keep working against the shared model.
 *
 * Idempotent: re-running upserts by _id. Read-only on the source collection.
 * Run with:  pnpm --filter @travel-suite/emirateslimo-backend migrate-admin-users:prod
 */
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

async function run() {
  if (!MONGO_URI) {
    console.error("Missing MONGO_URI in environment.");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  const sourceCol = mongoose.connection.db.collection("users");
  const targetCol = mongoose.connection.db.collection("admin-users");

  const docs = await sourceCol.find({}).toArray();
  if (!docs.length) {
    console.log("No documents in `users` collection — nothing to migrate.");
    await mongoose.disconnect();
    return;
  }

  const ops = docs.map((doc) => ({
    replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true },
  }));

  const result = await targetCol.bulkWrite(ops, { ordered: false });
  console.log(
    `Migrated ${docs.length} account(s) → admin-users ` +
      `(upserted: ${result.upsertedCount}, modified: ${result.modifiedCount}).`,
  );

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
