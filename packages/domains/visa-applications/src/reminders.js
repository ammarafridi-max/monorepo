// Reminder engine — chases customers so staff don't have to do it by hand.
//
// Two independent tracks run in one sweep:
//   Track A  incomplete application  → chase for missing documents (48h cadence,
//            escalate to staff after 4 customer reminders)
//   Track B  rejected document       → chase for the fix (24h then 72h, max 2)
//
// IDEMPOTENCY IS THE WHOLE POINT. The sweep must be safe to run twice back to
// back with no duplicate email. Every send is gated by an atomic
// findOneAndUpdate that CLAIMS the send (advancing the timestamp / counter that
// the filter also tests) — exactly the pattern the stripe-webhook-event lock in
// packages/domains/payments uses. Only the caller whose update matched actually
// sends; a concurrent or immediately-repeated sweep fails the filter and skips.

const HOUR = 60 * 60 * 1000;
const TRACK_A_INTERVAL_MS = 48 * HOUR;
const TRACK_A_MAX_REMINDERS = 4; // after this many, escalate to staff
const CLAIM_GUARD_MS = 20 * HOUR; // re-read guard: don't send if sent < 20h ago
const TRACK_B_FIRST_MS = 24 * HOUR; // first rejection reminder, 24h after rejection
const TRACK_B_SECOND_MS = 72 * HOUR; // second, 72h after the first
const TRACK_B_MAX = 2;

const humanize = (t) => String(t || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const ms = (d) => (d ? new Date(d).getTime() : 0);
const travellerName = (a) => `${a.firstName || ''} ${a.lastName || ''}`.trim() || (a.isPrimary ? 'Primary applicant' : 'Applicant');

/**
 * @param {{
 *   VisaApplication: import('mongoose').Model,
 *   Applicant: import('mongoose').Model,
 *   ApplicationDocument: import('mongoose').Model,
 *   User: import('mongoose').Model,
 *   notifications: object,
 *   appBaseUrl?: string,
 *   logger?: { info: Function, warn: Function, error: Function },
 * }} deps
 */
export function createReminderEngine({ VisaApplication, Applicant, ApplicationDocument, DocumentType, User, notifications, appBaseUrl = '', logger }) {
  const log = logger || console;
  const base = String(appBaseUrl || '').replace(/\/+$/, '');
  const linkFor = (ref) => `${base}/apply/${ref}`;

  async function customerEmailFor(userId) {
    const user = await User.findById(userId).select('email firstName').lean();
    return user?.email || null;
  }

  // Registry labels for nicer emails (falls back to a humanised key).
  async function labelMapFor(docs) {
    const keys = [...new Set(docs.map((d) => d.docTypeKey).filter(Boolean))];
    if (!keys.length || !DocumentType) return new Map();
    const types = await DocumentType.find({ key: { $in: keys } }).select('key label').lean();
    return new Map(types.map((t) => [t.key, t.label]));
  }

  // REQUIRED, never-uploaded, CUSTOMER-source documents, grouped by traveller.
  // CRITICAL: only source CUSTOMER rows — a customer is NEVER chased for a flight
  // reservation / insurance policy / cover letter that staff produce (AGENT), nor
  // for the in-person photo (IN_PERSON). Satisfied-by rows are already provided.
  async function missingByTraveller(appId) {
    const [applicants, docs] = await Promise.all([
      Applicant.find({ application: appId }).lean(),
      ApplicationDocument.find({ application: appId, source: 'CUSTOMER', status: 'REQUIRED', satisfiedBy: null }).lean(),
    ]);
    const labels = await labelMapFor(docs);
    const byId = new Map(applicants.map((a) => [String(a._id), a]));
    const groups = new Map();
    for (const d of docs) {
      const a = byId.get(String(d.applicant));
      if (!a) continue;
      const key = String(d.applicant);
      if (!groups.has(key)) groups.set(key, { traveller: travellerName(a), items: [] });
      groups.get(key).items.push(labels.get(d.docTypeKey) || humanize(d.docTypeKey));
    }
    return [...groups.values()].filter((g) => g.items.length);
  }

  // REJECTED CUSTOMER documents (with reasons), grouped by traveller. Track B only
  // chases the customer for their OWN rejected documents.
  async function rejectedByTraveller(appId) {
    const [applicants, docs] = await Promise.all([
      Applicant.find({ application: appId }).lean(),
      ApplicationDocument.find({ application: appId, source: 'CUSTOMER', status: 'REJECTED' }).lean(),
    ]);
    const labels = await labelMapFor(docs);
    const byId = new Map(applicants.map((a) => [String(a._id), a]));
    const groups = new Map();
    for (const d of docs) {
      const a = byId.get(String(d.applicant));
      if (!a) continue;
      const key = String(d.applicant);
      if (!groups.has(key)) groups.set(key, { traveller: travellerName(a), items: [] });
      groups.get(key).items.push({ document: labels.get(d.docTypeKey) || humanize(d.docTypeKey), reason: d.rejectionReason || 'Please re-upload a clearer copy.' });
    }
    return [...groups.values()].filter((g) => g.items.length);
  }

  // ---- Track A --------------------------------------------------------------
  async function runTrackA({ now, dryRun, summary }) {
    // customerCompletenessPercent (NOT the file completeness) — the customer's own
    // part of the file, so staff-produced documents never trigger a customer chase.
    const candidates = await VisaApplication.find({
      reminderState: 'ACTIVE',
      status: { $in: ['INFO_PENDING', 'INFO_COMPLETE'] },
      customerCompletenessPercent: { $lt: 100 },
    }).lean();

    summary.trackA.considered = candidates.length;

    for (const app of candidates) {
      const anchor = Math.max(ms(app.lastCustomerActionAt), ms(app.lastReminderSentAt), ms(app.createdAt));
      if (now - anchor <= TRACK_A_INTERVAL_MS) continue; // not due yet

      // --- escalation path: chased 4 times, still quiet → hand to staff ------
      if ((app.reminderCount || 0) >= TRACK_A_MAX_REMINDERS) {
        if (dryRun) { summary.trackA.wouldEscalate.push(app.applicationRef); continue; }
        // Flipping ACTIVE→ESCALATED is itself the idempotency guard.
        const escalated = await VisaApplication.findOneAndUpdate(
          { _id: app._id, reminderState: 'ACTIVE', reminderCount: { $gte: TRACK_A_MAX_REMINDERS } },
          { $set: { reminderState: 'ESCALATED' }, $push: { activityLog: { action: 'reminder_escalated', performedAt: new Date(now) } } },
          { new: true },
        );
        if (!escalated) continue; // another sweep escalated it first
        const email = await customerEmailFor(app.user);
        await notifications?.sendApplicationEscalated?.({
          applicationRef: app.applicationRef,
          destinationCountry: app.destinationCountry,
          customerEmail: email,
          reminderCount: app.reminderCount || 0,
          link: linkFor(app.applicationRef),
        });
        summary.trackA.escalated.push(app.applicationRef);
        continue;
      }

      // --- normal customer reminder ----------------------------------------
      const missing = await missingByTraveller(app._id);
      if (!missing.length) continue; // completeness<100 due to rejections only → Track B owns it

      if (dryRun) { summary.trackA.wouldSend.push({ applicationRef: app.applicationRef, missing }); continue; }

      // CLAIM: advance lastReminderSentAt (the guard the filter also tests) and
      // bump the counter atomically. Only the winner proceeds to send.
      const claimBefore = new Date(now - CLAIM_GUARD_MS);
      const claimed = await VisaApplication.findOneAndUpdate(
        {
          _id: app._id,
          reminderState: 'ACTIVE',
          status: { $in: ['INFO_PENDING', 'INFO_COMPLETE'] },
          reminderCount: { $lt: TRACK_A_MAX_REMINDERS },
          $or: [{ lastReminderSentAt: null }, { lastReminderSentAt: { $exists: false } }, { lastReminderSentAt: { $lt: claimBefore } }],
        },
        { $set: { lastReminderSentAt: new Date(now) }, $inc: { reminderCount: 1 }, $push: { activityLog: { action: 'reminder_sent', performedAt: new Date(now) } } },
        { new: false },
      );
      if (!claimed) continue; // already claimed by a concurrent/repeat sweep

      const email = await customerEmailFor(app.user);
      if (email) {
        await notifications?.sendDocumentsStillNeeded?.({
          email,
          applicationRef: app.applicationRef,
          destinationCountry: app.destinationCountry,
          missing,
          reminderNumber: (claimed.reminderCount || 0) + 1,
          link: linkFor(app.applicationRef),
        });
      }
      summary.trackA.sent.push(app.applicationRef);
    }
  }

  // ---- Track B --------------------------------------------------------------
  async function runTrackB({ now, dryRun, summary }) {
    // Applications that currently hold at least one REJECTED document, plus the
    // most recent rejection time (the anchor for the first reminder).
    const grouped = await ApplicationDocument.aggregate([
      { $match: { status: 'REJECTED' } },
      { $group: { _id: '$application', latestRejectionAt: { $max: '$reviewedAt' } } },
    ]);

    summary.trackB.considered = grouped.length;

    for (const g of grouped) {
      const app = await VisaApplication.findById(g._id).lean();
      if (!app) continue;
      if (app.reminderState !== 'ACTIVE') continue; // paused/escalated → don't chase
      const count = app.rejectionReminderCount || 0;
      if (count >= TRACK_B_MAX) continue; // cycle exhausted; resets on re-upload

      let due = false;
      if (count === 0) due = now - ms(g.latestRejectionAt) > TRACK_B_FIRST_MS;
      else if (count === 1) due = now - ms(app.lastRejectionReminderAt) > TRACK_B_SECOND_MS;
      if (!due) continue;

      const rejected = await rejectedByTraveller(app._id);
      if (!rejected.length) continue; // race: re-uploaded between query and now

      if (dryRun) { summary.trackB.wouldSend.push({ applicationRef: app.applicationRef, reminderNumber: count + 1, rejected }); continue; }

      // CLAIM keyed on the exact current count — exactly one sweep wins per cycle step.
      const claimed = await VisaApplication.findOneAndUpdate(
        { _id: app._id, reminderState: 'ACTIVE', rejectionReminderCount: count },
        { $set: { lastRejectionReminderAt: new Date(now) }, $inc: { rejectionReminderCount: 1 }, $push: { activityLog: { action: 'rejection_reminder_sent', performedAt: new Date(now) } } },
        { new: false },
      );
      if (!claimed) continue;

      const email = await customerEmailFor(app.user);
      if (email) {
        await notifications?.sendRejectionReminder?.({
          email,
          applicationRef: app.applicationRef,
          destinationCountry: app.destinationCountry,
          rejected,
          reminderNumber: count + 1,
          link: linkFor(app.applicationRef),
        });
      }
      summary.trackB.sent.push(app.applicationRef);
    }
  }

  /**
   * Run one full sweep. Safe to run repeatedly (idempotent per the claim guards).
   * @param {{ dryRun?: boolean }} [opts] dryRun reports what WOULD be sent without sending or mutating.
   * @returns a structured summary of what was (or would be) sent.
   */
  async function runReminderSweep({ dryRun = false } = {}) {
    const now = Date.now();
    const summary = {
      dryRun,
      ranAt: new Date(now).toISOString(),
      trackA: { considered: 0, sent: [], escalated: [], wouldSend: [], wouldEscalate: [] },
      trackB: { considered: 0, sent: [], wouldSend: [] },
    };
    try {
      await runTrackA({ now, dryRun, summary });
    } catch (err) {
      log.error?.('[visa-reminders] Track A failed', { error: err.message });
    }
    try {
      await runTrackB({ now, dryRun, summary });
    } catch (err) {
      log.error?.('[visa-reminders] Track B failed', { error: err.message });
    }
    log.info?.('[visa-reminders] sweep complete', {
      dryRun,
      trackASent: summary.trackA.sent.length,
      trackAEscalated: summary.trackA.escalated.length,
      trackBSent: summary.trackB.sent.length,
    });
    return summary;
  }

  return { runReminderSweep };
}
