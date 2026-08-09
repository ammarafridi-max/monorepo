// SCRIPT 3 — reminder engine against REAL MongoDB.
//
// The point of this script is the ATOMIC CLAIM under real concurrency: two sweeps
// running at the same moment on two separate mongoose connections must still send
// exactly one email. A single-threaded mock can never prove that; only a real
// findOneAndUpdate race against MongoDB can.
//
// Email sends are counted by wrapping the REAL Brevo sender (not a mock) — so this
// script DOES send real email. Point it at a staging Brevo/recipient.

import {
  readEnv, requireEnv, Reporter, connect, describeConnection, buildSystem, makeStorage,
  makeNotifications, makeSamplePdf, runCleanups, uniqueRef,
} from './_shared.mjs';
import { sendEmail as realSendEmail } from '../../src/utils/email.js';

const env = readEnv();
requireEnv(env, ['mongoUri', 'cloudinary.cloudName', 'cloudinary.apiKey', 'cloudinary.apiSecret', 'jwtSecret']);

const r = Reporter('verify-reminders');
const cleanups = [];
const conns = [];
const DAY = 86400000;

// Shared, resettable email counter. The wrapper calls REAL Brevo, then records.
const counter = { count: 0, recipients: [] };
const reset = () => { counter.count = 0; counter.recipients = []; };
function countingSender() {
  return async (args) => {
    counter.count += 1;
    counter.recipients.push(args.email);
    return realSendEmail(args);
  };
}
const customerEmail = env.verifyEmailTo || null;

// Idempotently ensure a DocumentType exists (the registry replaced the old enum).
async function ensureDocType(sys, key, source, label) {
  await sys.DocumentType.updateOne({ key }, { $setOnInsert: { key, source, label: label || key, isActive: true } }, { upsert: true });
  return sys.DocumentType.findOne({ key });
}

// Seed a real application with a CUSTOMER passport row (and optionally an AGENT
// flight-reservation row) so we can prove Track A only ever chases CUSTOMER rows.
async function seedEligibleApp(sys, opts = {}) {
  const ref = uniqueRef('REM');
  const email = customerEmail || `${ref.toLowerCase()}@verify.visawadi.ae`;
  const user = await sys.User.create({ email, firstName: 'Rem', lastName: 'Inder', password: 'x'.repeat(24) });
  const passportType = await ensureDocType(sys, 'PASSPORT', 'CUSTOMER', 'Passport');
  const flightType = opts.withAgent ? await ensureDocType(sys, 'FLIGHT_RESERVATION', 'AGENT', 'Flight reservation') : null;

  const app = await sys.VisaApplication.create({
    applicationRef: ref, user: user._id, destinationCountry: 'Germany',
    status: opts.status || 'INFO_PENDING', reminderState: 'ACTIVE',
    customerCompletenessPercent: opts.customerCompleteness ?? 0,
    fileCompletenessPercent: opts.customerCompleteness ?? 0,
    reminderCount: opts.reminderCount ?? 0, rejectionReminderCount: 0,
    lastCustomerActionAt: new Date(Date.now() - (opts.lastActionDaysAgo ?? 3) * DAY),
    createdAt: new Date(Date.now() - 10 * DAY),
  });
  const applicant = await sys.Applicant.create({ application: app._id, isPrimary: true, firstName: 'Rem', lastName: 'Inder' });
  const passportRow = await sys.ApplicationDocument.create({
    application: app._id, applicant: applicant._id, documentType: passportType._id, docTypeKey: 'PASSPORT',
    source: 'CUSTOMER', status: opts.passportStatus || 'REQUIRED',
  });
  if (flightType) {
    await sys.ApplicationDocument.create({
      application: app._id, applicant: applicant._id, documentType: flightType._id, docTypeKey: 'FLIGHT_RESERVATION',
      source: 'AGENT', status: 'REQUIRED',
    });
  }
  cleanups.push(async () => {
    await sys.ApplicationDocument.deleteMany({ application: app._id });
    await sys.Applicant.deleteMany({ application: app._id });
    await sys.VisaApplication.deleteOne({ _id: app._id });
    await sys.User.deleteOne({ _id: user._id });
  });
  return { app, applicant, user, passportRow, ref };
}

const age = (sys, id, patch) => sys.VisaApplication.updateOne({ _id: id }, { $set: patch });

try {
  const storage = makeStorage(env);
  const notifA = makeNotifications({ sendEmail: countingSender() });
  const connA = await connect(env.mongoUri); conns.push(connA);
  const sysA = buildSystem(connA, { env, storage, notifications: notifA });

  // Make it unmistakable where this is pointed BEFORE any write happens.
  r.info(`MongoDB target: ${describeConnection(connA, env.mongoUri)}`);
  if (!customerEmail) r.info('VERIFY_EMAIL_TO not set — customer reminders go to a synthetic @verify.visawadi.ae address (Brevo will accept then bounce).');

  // ---- 1. sequential double sweep -> exactly one email ------------------------
  {
    const { app } = await seedEligibleApp(sysA);
    reset();
    await sysA.runReminderSweep();
    await sysA.runReminderSweep();
    const after = await sysA.VisaApplication.findById(app._id).lean();
    r.check(counter.count === 1, `sequential double sweep sent exactly 1 email (got ${counter.count})`);
    r.check(after.reminderCount === 1, `reminderCount incremented by exactly 1 (got ${after.reminderCount})`);
  }

  // ---- 2. CONCURRENT sweep on two connections -> exactly one email ------------
  {
    const { app } = await seedEligibleApp(sysA);
    const connB = await connect(env.mongoUri); conns.push(connB);
    const notifB = makeNotifications({ sendEmail: countingSender() }); // shares `counter`
    const sysB = buildSystem(connB, { env, storage, notifications: notifB });
    reset();
    await Promise.all([sysA.runReminderSweep(), sysB.runReminderSweep()]);
    const after = await sysA.VisaApplication.findById(app._id).lean();
    r.critical(counter.count === 1, `CONCURRENT sweep (2 connections) sent exactly 1 email (got ${counter.count}) — atomic claim holds under real MongoDB`);
    r.check(after.reminderCount === 1, `reminderCount incremented by exactly 1 under concurrency (got ${after.reminderCount})`);
  }

  // ---- 3. escalation after 4 reminders ---------------------------------------
  {
    const { app } = await seedEligibleApp(sysA);
    reset();
    // Four eligible sweeps, ageing the timers between each so the next is due.
    for (let i = 0; i < 4; i += 1) {
      await age(sysA, app._id, { lastReminderSentAt: new Date(Date.now() - 3 * DAY), lastCustomerActionAt: new Date(Date.now() - 3 * DAY) });
      await sysA.runReminderSweep();
    }
    const afterFour = await sysA.VisaApplication.findById(app._id).lean();
    const customerSends = counter.recipients.filter((e) => e !== env.adminEmail).length;
    r.check(afterFour.reminderCount === 4 && customerSends === 4, `4 customer reminders sent (reminderCount=${afterFour.reminderCount}, customerSends=${customerSends})`);

    // Fifth eligible sweep -> escalate: staff emailed, customer NOT.
    reset();
    await age(sysA, app._id, { lastReminderSentAt: new Date(Date.now() - 3 * DAY), lastCustomerActionAt: new Date(Date.now() - 3 * DAY) });
    await sysA.runReminderSweep();
    const escalated = await sysA.VisaApplication.findById(app._id).lean();
    const staffSends = counter.recipients.filter((e) => e === env.adminEmail).length;
    const custSends = counter.recipients.filter((e) => e !== env.adminEmail).length;
    r.check(escalated.reminderState === 'ESCALATED', `state flipped ACTIVE -> ESCALATED once (got ${escalated.reminderState})`);
    r.check(staffSends === 1 && custSends === 0, `escalation emailed staff only (staff=${staffSends}, customer=${custSends})`);

    // Further sweeps do nothing (ESCALATED is out of the Track A query).
    reset();
    await age(sysA, app._id, { lastReminderSentAt: new Date(Date.now() - 3 * DAY) });
    await sysA.runReminderSweep();
    r.check(counter.count === 0, `no further emails after escalation (got ${counter.count})`);
  }

  // ---- 4. Track B: rejection nudge, reset on re-upload -----------------------
  {
    const { app, applicant, passportRow } = await seedEligibleApp(sysA, { status: 'DOCS_READY', customerCompleteness: 80 });
    await sysA.ApplicationDocument.updateOne({ _id: passportRow._id }, { $set: { status: 'REJECTED', rejectionReason: 'Blurry', reviewedAt: new Date(Date.now() - 2 * DAY) } });
    await age(sysA, app._id, { rejectionReminderCount: 0, lastRejectionReminderAt: null });

    reset();
    await sysA.runReminderSweep();
    const afterB1 = await sysA.VisaApplication.findById(app._id).lean();
    r.check(counter.count === 1 && afterB1.rejectionReminderCount === 1, `Track B 24h nudge fired once (sends=${counter.count}, rejectionReminderCount=${afterB1.rejectionReminderCount})`);

    // Real re-upload through the service (real Cloudinary) -> resets Track B.
    const uploaded = await sysA.service.uploadDocument({
      userId: app.user, applicationRef: app.applicationRef, applicantId: applicant._id, documentId: passportRow._id,
      file: { buffer: makeSamplePdf(), mimetype: 'application/pdf', size: makeSamplePdf().length, originalname: 'passport.pdf' },
    });
    cleanups.push(() => storage.deleteAuthenticatedFile(uploaded.cloudinaryPublicId, { resourceType: 'image' }));
    const afterReupload = await sysA.VisaApplication.findById(app._id).lean();
    r.check(afterReupload.rejectionReminderCount === 0, `re-upload reset Track B counter to 0 (got ${afterReupload.rejectionReminderCount})`);

    reset();
    await sysA.runReminderSweep();
    r.check(counter.count === 0, `72h nudge does NOT fire after re-upload (got ${counter.count} sends)`);
  }

  // ---- 6. CRITICAL: Track A only ever chases CUSTOMER rows --------------------
  {
    // (a) A candidate missing a CUSTOMER passport AND an AGENT flight reservation.
    //     The reminder must list only the passport, never the staff-produced flight.
    const { app } = await seedEligibleApp(sysA, { withAgent: true, customerCompleteness: 50 });
    reset();
    const summary = await sysA.runReminderSweep({ dryRun: true });
    const entry = (summary.trackA.wouldSend || []).find((w) => w.applicationRef === app.applicationRef);
    const items = entry ? entry.missing.flatMap((g) => g.items) : [];
    r.critical(items.length > 0 && items.every((i) => !/flight/i.test(i)),
      `Track A lists only CUSTOMER documents, never the AGENT flight reservation (listed: ${items.join(', ') || 'none'})`);

    // (b) The customer has finished all THEIR documents (customerCompletenessPercent
    //     = 100) but a staff AGENT document is still pending — they must NOT be chased.
    await seedEligibleApp(sysA, { withAgent: true, customerCompleteness: 100, passportStatus: 'APPROVED' });
    reset();
    await sysA.runReminderSweep();
    r.critical(counter.count === 0, `a customer whose own documents are all done is NOT chased for a pending staff document (got ${counter.count} sends)`);
  }

  // ---- 5. dryRun mutates nothing ---------------------------------------------
  {
    const { app } = await seedEligibleApp(sysA);
    const before = await sysA.VisaApplication.findById(app._id).lean();
    reset();
    const summary = await sysA.runReminderSweep({ dryRun: true });
    const after = await sysA.VisaApplication.findById(app._id).lean();
    r.check(counter.count === 0, `dryRun sent no email (got ${counter.count})`);
    r.check(after.reminderCount === before.reminderCount, 'dryRun did not change reminderCount');
    r.check(String(after.lastReminderSentAt) === String(before.lastReminderSentAt), 'dryRun did not change lastReminderSentAt');
    r.check((summary.trackA.wouldSend || []).length >= 1, 'dryRun reports what it WOULD send');
  }
} catch (err) {
  r.fail(`unexpected error: ${err.stack || err.message}`);
} finally {
  await runCleanups(cleanups);
  for (const c of conns) { try { await c.close(); } catch { /* ignore */ } }
}

const failures = r.summary();
process.exit(failures > 0 ? 1 : 0);
