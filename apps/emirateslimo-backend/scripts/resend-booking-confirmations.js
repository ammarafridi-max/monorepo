/* eslint-disable no-console */
/**
 * Usage:
 *   node --env-file=apps/emirateslimo-backend/.env.production \
 *        apps/emirateslimo-backend/scripts/resend-booking-confirmations.js --db=<dbname> [--apply] [--limit=N] [--since=YYYY-MM-DD] [--recipient=customer|admin|both]
 *
 * --apply sends real email to real customers; without it nothing leaves the machine.
 */
import mongoose from "mongoose";

import { BookingSchema, deliverPaymentConfirmations } from "@travel-suite/limo-bookings";
import { VehicleSchema } from "@travel-suite/vehicles";
import { ZoneSchema } from "@travel-suite/zones";
import { sendEmail } from "../src/utils/email.js";
import { createBookingNotifications } from "../src/notifications/booking.js";
import config from "../src/utils/config.js";

const argv = process.argv.slice(2);
const flag = (name) => argv.some((a) => a === `--${name}`);
const value = (name, fallback) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const APPLY = flag("apply");
const EXPECTED_DB = value("db");
const LIMIT = Number(value("limit", 50));
const SINCE = value("since");
const RECIPIENT = value("recipient", "both");

const model = (conn, name, schema) => {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
};

function buildFilter() {
  const notSent = (key) => ({
    [`notifications.paymentConfirmation.${key}.status`]: { $ne: "sent" },
  });

  const filter = { "payment.status": "paid" };
  if (RECIPIENT === "customer") Object.assign(filter, notSent("customer"));
  else if (RECIPIENT === "admin") Object.assign(filter, notSent("admin"));
  else filter.$or = [notSent("customer"), notSent("admin")];

  if (SINCE) {
    const since = new Date(SINCE);
    if (Number.isNaN(since.getTime())) throw new Error(`--since is not a date: ${SINCE}`);
    filter.createdAt = { $gte: since };
  }
  return filter;
}

async function run() {
  if (!config.mongoUri) throw new Error("MONGO_URI is required");
  if (!EXPECTED_DB) {
    throw new Error(
      "--db=<name> is required. It names the database you INTEND to touch and is checked against the one MONGO_URI actually opens.",
    );
  }
  if (!["both", "customer", "admin"].includes(RECIPIENT)) {
    throw new Error(`--recipient must be customer, admin or both (got: ${RECIPIENT})`);
  }
  if (!Number.isFinite(LIMIT) || LIMIT <= 0) throw new Error("--limit must be a positive number");

  await mongoose.connect(config.mongoUri);
  const conn = mongoose.connection;

  // Wrong-database guard: bail before reading anything if the names disagree.
  if (conn.name !== EXPECTED_DB) {
    await mongoose.disconnect();
    throw new Error(
      `Refusing to run: MONGO_URI points at database "${conn.name}" but --db=${EXPECTED_DB} was requested.`,
    );
  }

  model(conn, "Vehicle", VehicleSchema);
  model(conn, "Zone", ZoneSchema);
  model(conn, "admin-user", new mongoose.Schema({}, { strict: false, collection: "admin-users" }));
  const Booking = model(conn, "Booking", BookingSchema);

  const filter = buildFilter();
  const total = await Booking.countDocuments(filter);
  const bookings = await Booking.find(filter).sort({ createdAt: 1 }).limit(LIMIT);

  console.log(`\n[resend] database: ${conn.name}`);
  console.log(`[resend] mode:     ${APPLY ? "APPLY (emails will be sent)" : "dry run (nothing sent)"}`);
  console.log(`[resend] paid bookings missing a confirmation: ${total} (processing up to ${LIMIT})\n`);

  for (const booking of bookings) {
    const pc = booking.notifications?.paymentConfirmation;
    const state = (key) => {
      const rec = pc?.[key];
      const status = rec?.status || "never-recorded";
      const err = rec?.lastError ? ` (${rec.lastError})` : "";
      return `${key}=${status}${err}`;
    };
    console.log(
      `  ${booking.bookingRef}  ${booking.createdAt?.toISOString().slice(0, 10)}  ` +
        `${booking.payment?.currency} ${booking.payment?.amount}  ${booking.bookingDetails?.email}\n` +
        `      ${state("customer")}  |  ${state("admin")}`,
    );
  }

  if (!APPLY) {
    console.log(`\n[resend] dry run complete. Re-run with --apply to send.`);
    await mongoose.disconnect();
    return;
  }

  const notifications = createBookingNotifications({ sendEmail, config });
  const wanted = (booking, key) => {
    if (RECIPIENT !== "both" && RECIPIENT !== key) return false;
    return booking.notifications?.paymentConfirmation?.[key]?.status !== "sent";
  };

  let sent = 0;
  let failed = 0;
  console.log("");
  for (const booking of bookings) {
    const results = await deliverPaymentConfirmations({
      Booking,
      booking,
      notifications: {
        sendPaymentConfirmationEmailCustomer: wanted(booking, "customer")
          ? notifications.sendPaymentConfirmationEmailCustomer
          : undefined,
        sendPaymentConfirmationEmailAdmin: wanted(booking, "admin")
          ? notifications.sendPaymentConfirmationEmailAdmin
          : undefined,
      },
    });

    for (const key of ["customer", "admin"]) {
      if (!results[key]) continue;
      if (results[key].ok) sent++;
      else failed++;
      console.log(
        `  ${booking.bookingRef}  ${key}: ${results[key].ok ? "sent" : `FAILED - ${results[key].error}`}`,
      );
    }
  }

  console.log(`\n[resend] done. sent: ${sent}, failed: ${failed}.`);
  if (failed) console.log("[resend] failures are recorded on the bookings; fix the cause and re-run.");
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(`[resend] FAILED: ${err.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
