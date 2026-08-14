// Every send is gated by an atomic findOneAndUpdate that claims it, so a repeated or concurrent sweep never double-emails.

const HOUR = 60 * 60 * 1000;
const TRACK_A_INTERVAL_MS = 48 * HOUR;
const TRACK_A_MAX_REMINDERS = 4;
const CLAIM_GUARD_MS = 20 * HOUR;
const TRACK_B_FIRST_MS = 24 * HOUR;
const TRACK_B_SECOND_MS = 72 * HOUR;
const TRACK_B_MAX = 2;

const humanize = (t) => String(t || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const ms = (d) => (d ? new Date(d).getTime() : 0);
const travellerName = (a) => `${a.firstName || ''} ${a.lastName || ''}`.trim() || (a.isPrimary ? 'Primary applicant' : 'Applicant');

export function createReminderEngine({ VisaApplication, Applicant, ApplicationDocument, DocumentType, User, notifications, appBaseUrl = '', logger }) {
  const log = logger || console;
  const base = String(appBaseUrl || '').replace(/\/+$/, '');
  const linkFor = (ref) => `${base}/apply/${ref}`;

  async function customerEmailFor(userId) {
    const user = await User.findById(userId).select('email firstName').lean();
    return user?.email || null;
  }

  async function labelMapFor(docs) {
    const keys = [...new Set(docs.map((d) => d.docTypeKey).filter(Boolean))];
    if (!keys.length || !DocumentType) return new Map();
    const types = await DocumentType.find({ key: { $in: keys } }).select('key label').lean();
    return new Map(types.map((t) => [t.key, t.label]));
  }

  // Only CUSTOMER-source rows: a customer is never chased for a document staff produce.
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

  async function runTrackA({ now, dryRun, summary }) {
    const candidates = await VisaApplication.find({
      reminderState: 'ACTIVE',
      status: { $in: ['INFO_PENDING', 'INFO_COMPLETE'] },
      customerCompletenessPercent: { $lt: 100 },
    }).lean();

    summary.trackA.considered = candidates.length;

    for (const app of candidates) {
      const anchor = Math.max(ms(app.lastCustomerActionAt), ms(app.lastReminderSentAt), ms(app.createdAt));
      if (now - anchor <= TRACK_A_INTERVAL_MS) continue;

      if ((app.reminderCount || 0) >= TRACK_A_MAX_REMINDERS) {
        if (dryRun) { summary.trackA.wouldEscalate.push(app.applicationRef); continue; }
        const escalated = await VisaApplication.findOneAndUpdate(
          { _id: app._id, reminderState: 'ACTIVE', reminderCount: { $gte: TRACK_A_MAX_REMINDERS } },
          { $set: { reminderState: 'ESCALATED' }, $push: { activityLog: { action: 'reminder_escalated', performedAt: new Date(now) } } },
          { new: true },
        );
        if (!escalated) continue;
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

      const missing = await missingByTraveller(app._id);
      if (!missing.length) continue;

      if (dryRun) { summary.trackA.wouldSend.push({ applicationRef: app.applicationRef, missing }); continue; }

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
      if (!claimed) continue;

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

  async function runTrackB({ now, dryRun, summary }) {
    const grouped = await ApplicationDocument.aggregate([
      { $match: { status: 'REJECTED' } },
      { $group: { _id: '$application', latestRejectionAt: { $max: '$reviewedAt' } } },
    ]);

    summary.trackB.considered = grouped.length;

    for (const g of grouped) {
      const app = await VisaApplication.findById(g._id).lean();
      if (!app) continue;
      if (app.reminderState !== 'ACTIVE') continue;
      const count = app.rejectionReminderCount || 0;
      if (count >= TRACK_B_MAX) continue;

      let due = false;
      if (count === 0) due = now - ms(g.latestRejectionAt) > TRACK_B_FIRST_MS;
      else if (count === 1) due = now - ms(app.lastRejectionReminderAt) > TRACK_B_SECOND_MS;
      if (!due) continue;

      const rejected = await rejectedByTraveller(app._id);
      if (!rejected.length) continue;

      if (dryRun) { summary.trackB.wouldSend.push({ applicationRef: app.applicationRef, reminderNumber: count + 1, rejected }); continue; }

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
