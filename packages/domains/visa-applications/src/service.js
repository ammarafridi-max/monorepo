import crypto from 'crypto';
import mongoose from 'mongoose';
import { AppError } from '@travel-suite/utils';
import { APPLICATION_STATUSES, APPOINTMENT_STATUSES } from './schemas/visaApplication.schema.js';
import { ACCOMMODATION_TYPES } from './schemas/checklistTemplate.schema.js';
import { deriveAgeGroup, evaluateTemplate, neededProfileFields, templateReferencesCondition } from './matcher.js';

const MAX_BYTES = 15 * 1024 * 1024;
// mimeType -> file extension, used when signing/serving Cloudinary authenticated assets.
const MIME_EXT = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' };
// Unambiguous alphabet (no 0/O/1/I) for the human-readable ref suffix.
const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSuffix(len = 4) {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i += 1) out += REF_ALPHABET[bytes[i] % REF_ALPHABET.length];
  return out;
}

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const humanize = (k) => String(k || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

// The effective status of a row. A satisfied-by row derives its status from the
// document that fulfils it (in the same application).
function effectiveStatus(doc, byId) {
  if (doc.satisfiedBy) {
    const src = byId.get(String(doc.satisfiedBy));
    return src ? src.status : 'UPLOADED';
  }
  return doc.status;
}

// Completeness ignores NOT_APPLICABLE rows in the denominator. A regular row is
// "done" once UPLOADED or APPROVED; a satisfied-by row is done only when its source
// row is APPROVED. `onlyCustomer` restricts to source CUSTOMER rows.
function completeness(documents = [], { onlyCustomer = false } = {}) {
  const byId = new Map(documents.map((d) => [String(d._id), d]));
  const applicable = documents.filter((d) => d.status !== 'NOT_APPLICABLE' && (!onlyCustomer || d.source === 'CUSTOMER'));
  if (!applicable.length) return 0;
  let done = 0;
  for (const d of applicable) {
    const st = effectiveStatus(d, byId);
    if (d.satisfiedBy) { if (st === 'APPROVED') done += 1; }
    else if (st === 'UPLOADED' || st === 'APPROVED') done += 1;
  }
  return Math.round((done / applicable.length) * 100);
}

// Ready to submit = the whole file is done (fileCompleteness 100) AND every
// non-optional applicable row is effectively APPROVED (an IN_PERSON "marked done"
// and a satisfied-by row whose source is APPROVED both read as APPROVED).
function computeReadyToSubmit(documents = []) {
  const byId = new Map(documents.map((d) => [String(d._id), d]));
  const applicable = documents.filter((d) => d.status !== 'NOT_APPLICABLE');
  if (!applicable.length) return false;
  if (completeness(documents) !== 100) return false;
  return applicable.filter((d) => !d.isOptional).every((d) => effectiveStatus(d, byId) === 'APPROVED');
}

export function createVisaApplicationService({
  VisaApplication,
  Applicant,
  ApplicationDocument,
  DocumentType,
  ChecklistTemplate,
  User,
  storage,
  notifications,
  apiBaseUrl = '',
  appBaseUrl = '',
}) {
  // ---- ref generation --------------------------------------------------------
  async function generateApplicationRef() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const ref = `TVL-${yy}${mm}-${randomSuffix(4)}`;
      const clash = await VisaApplication.exists({ applicationRef: ref });
      if (!clash) return ref;
    }
    throw new AppError('Could not allocate an application reference, please retry', 500);
  }

  // ---- magic link (reuses the User model's token method) ---------------------
  async function buildMagicLink(user) {
    const rawToken = user.createMagicLinkToken();
    await user.save({ validateBeforeSave: false });
    const base = String(apiBaseUrl || '').replace(/\/+$/, '');
    return `${base}/api/users/magic-link/${rawToken}`;
  }

  // ==========================================================================
  // TEMPLATE + CHECKLIST (data-driven)
  // ==========================================================================
  async function loadActiveTemplate(visaTypeKey) {
    const key = String(visaTypeKey || 'SCHENGEN').toUpperCase();
    return ChecklistTemplate.findOne({ visaTypeKey: key, isActive: true }).lean();
  }

  function applicantContext(applicant, application) {
    const travelDate = application?.intendedTravelDates?.from || null;
    return {
      ageGroup: deriveAgeGroup(applicant.dateOfBirth, travelDate),
      employmentStatus: applicant.employmentStatus || null,
      financialSupport: applicant.financialSupport || null,
      accommodationType: application?.accommodationType || 'HOTEL',
      minorTravellingWith: applicant.minorTravellingWith || null,
      isPrimary: !!applicant.isPrimary,
    };
  }

  // Which profile questions this applicant must still answer before we can seed.
  // accommodationType is application-level (has a default) so it never blocks here.
  function neededFieldsForApplicant(template, applicant, application) {
    if (!template) return [];
    const ctx = applicantContext(applicant, application);
    return neededProfileFields(template.rules || [], ctx).filter((f) => f !== 'accommodationType');
  }

  // Reconcile an applicant's checklist rows against the active template's rules.
  // SAFETY (unchanged from Phase 2): never delete or alter an UPLOADED / APPROVED /
  // REJECTED row, and never touch a manually-added row. Rows that no longer apply
  // become NOT_APPLICABLE. Seeding is BLOCKED until every referenced profile question
  // is answered.
  async function reconcileChecklistForApplicant(applicant, application) {
    const app = application || (await VisaApplication.findById(applicant.application));
    if (!app) return false;
    const template = await loadActiveTemplate(app.visaTypeKey);
    if (!template) return false;
    if (neededFieldsForApplicant(template, applicant, app).length) return false; // profile incomplete

    const ctx = applicantContext(applicant, app);
    const desired = evaluateTemplate(template.rules || [], ctx); // [{ documentTypeKey, isOptional }]
    const desiredByKey = new Map(desired.map((d) => [d.documentTypeKey, d]));
    const types = await DocumentType.find({ key: { $in: desired.map((d) => d.documentTypeKey) } }).lean();
    const typeByKey = new Map(types.map((t) => [t.key, t]));

    const existing = await ApplicationDocument.find({ applicant: applicant._id });
    const byKey = new Map(existing.map((d) => [d.docTypeKey, d]));
    let changed = false;

    for (const d of desired) {
      const type = typeByKey.get(d.documentTypeKey);
      if (!type || !type.isActive) continue; // rule references a missing/inactive type — skip safely
      const row = byKey.get(d.documentTypeKey);
      if (!row) {
        await ApplicationDocument.create({
          application: app._id,
          applicant: applicant._id,
          documentType: type._id,
          docTypeKey: type.key,
          source: type.source,
          status: 'REQUIRED',
          isOptional: !!d.isOptional,
        });
        changed = true;
      } else {
        let dirty = false;
        if (row.status === 'NOT_APPLICABLE') { row.status = 'REQUIRED'; dirty = true; }
        if (row.isOptional !== !!d.isOptional) { row.isOptional = !!d.isOptional; dirty = true; }
        if (row.source !== type.source) { row.source = type.source; dirty = true; }
        if (!row.documentType) { row.documentType = type._id; dirty = true; }
        if (dirty) { await row.save(); changed = true; }
      }
    }

    for (const row of existing) {
      if (!desiredByKey.has(row.docTypeKey) && row.status === 'REQUIRED' && !row.addedManually) {
        row.status = 'NOT_APPLICABLE';
        await row.save();
        changed = true;
      }
    }

    return changed;
  }

  async function reconcileAllApplicants(application) {
    const applicants = await Applicant.find({ application: application._id });
    for (const a of applicants) await reconcileChecklistForApplicant(a, application);
  }

  // One-shot staff email when a file first becomes the STAFF's turn (customer done).
  // Atomically claimed the same way reminder sends are, so it fires exactly once.
  async function notifyStaffFileReady(application) {
    const claimed = await VisaApplication.findOneAndUpdate(
      { _id: application._id, $or: [{ customerCompleteNotifiedAt: null }, { customerCompleteNotifiedAt: { $exists: false } }] },
      { $set: { customerCompleteNotifiedAt: new Date() } },
      { new: false },
    );
    if (!claimed || claimed.customerCompleteNotifiedAt) return; // already notified
    notifications?.sendFileReadyForStaff?.({
      applicationRef: application.applicationRef,
      destinationCountry: application.destinationCountry,
    }).catch?.(() => {});
  }

  // Recompute and persist BOTH completeness numbers, the readyToSubmit flag, and the
  // customer-completed timestamp. Sends the staff "your turn" email on the first
  // transition to customer-complete.
  async function recalcCompleteness(application) {
    const docs = await ApplicationDocument.find({ application: application._id })
      .select('status source satisfiedBy isOptional').lean();
    const customer = completeness(docs, { onlyCustomer: true });
    const file = completeness(docs);
    const ready = computeReadyToSubmit(docs);
    const prevCustomer = application.customerCompletenessPercent ?? 0;

    let dirty = false;
    if (application.customerCompletenessPercent !== customer) { application.customerCompletenessPercent = customer; dirty = true; }
    if (application.fileCompletenessPercent !== file) { application.fileCompletenessPercent = file; dirty = true; }
    if (application.readyToSubmit !== ready) { application.readyToSubmit = ready; dirty = true; }
    // "customer completed" timestamp: set when they first hit 100, clear if it drops.
    if (customer === 100 && !application.customerCompletedAt) { application.customerCompletedAt = new Date(); dirty = true; }
    if (customer < 100 && application.customerCompletedAt) { application.customerCompletedAt = null; dirty = true; }
    if (dirty) await application.save();

    if (customer === 100 && prevCustomer < 100) await notifyStaffFileReady(application);
    return { customer, file };
  }

  async function addApplicant({ application, data = {}, isPrimary = false }) {
    const applicant = await Applicant.create({
      application: application._id,
      isPrimary,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      dateOfBirth: data.dateOfBirth || undefined,
      nationality: data.nationality || '',
      passportNumber: data.passportNumber || '',
      passportExpiry: data.passportExpiry || undefined,
      relationshipToPrimary: data.relationshipToPrimary || '',
      employmentStatus: data.employmentStatus || null,
      financialSupport: data.financialSupport || null,
      minorTravellingWith: data.minorTravellingWith || null,
    });
    // Only seeds rows once the applicant's profile is complete for the template.
    await reconcileChecklistForApplicant(applicant, application);
    return applicant;
  }

  // ---- ownership -------------------------------------------------------------
  async function loadOwnedApplication(userId, applicationRef) {
    const application = await VisaApplication.findOne({ applicationRef: String(applicationRef).toUpperCase() });
    if (!application) throw new AppError('Application not found', 404);
    if (String(application.user) !== String(userId)) throw new AppError('Application not found', 404);
    return application;
  }

  // Enrich documents + applicants for display. Adds label/help/source from the
  // DocumentType, resolves satisfied-by rows, and computes needed profile questions.
  async function hydrate(application) {
    const app = application.toObject ? application.toObject() : application;
    const applicants = await Applicant.find({ application: app._id }).sort({ isPrimary: -1, createdAt: 1 }).lean();
    const documents = await ApplicationDocument.find({ application: app._id }).lean();
    const template = await loadActiveTemplate(app.visaTypeKey);

    const typeIds = [...new Set(documents.map((d) => String(d.documentType)).filter(Boolean))];
    const types = typeIds.length ? await DocumentType.find({ _id: { $in: typeIds } }).lean() : [];
    const typeById = new Map(types.map((t) => [String(t._id), t]));
    const docById = new Map(documents.map((d) => [String(d._id), d]));
    const applicantNameById = new Map(applicants.map((a) => [String(a._id), `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Applicant']));

    const enrichedById = new Map();
    const enriched = documents.map((d) => {
      const t = typeById.get(String(d.documentType));
      const src = d.satisfiedBy ? docById.get(String(d.satisfiedBy)) : null;
      const row = {
        ...d,
        label: t?.label || humanize(d.docTypeKey),
        customerHelpText: t?.customerHelpText || '',
        acceptedMimeTypes: t?.acceptedMimeTypes || Object.keys(MIME_EXT),
        effectiveStatus: effectiveStatus(d, docById),
        satisfiedByInfo: src
          ? { documentId: String(src._id), applicantName: applicantNameById.get(String(src.applicant)) || 'another applicant', docTypeKey: src.docTypeKey }
          : null,
      };
      enrichedById.set(String(d._id), row);
      return row;
    });

    const byApplicant = new Map(applicants.map((a) => [String(a._id), []]));
    for (const row of enriched) {
      const list = byApplicant.get(String(row.applicant));
      if (list) list.push(row);
    }

    const travelDate = app.intendedTravelDates?.from || null;
    const applicantsOut = applicants.map((a) => ({
      ...a,
      ageGroup: deriveAgeGroup(a.dateOfBirth, travelDate),
      neededProfileFields: template ? neededFieldsForApplicant(template, a, app) : [],
      documents: byApplicant.get(String(a._id)) || [],
    }));

    return {
      ...app,
      applicants: applicantsOut,
      customerCompleteness: completeness(documents, { onlyCustomer: true }),
      fileCompleteness: completeness(documents),
      accommodationQuestionNeeded: template ? templateReferencesCondition(template.rules || [], 'accommodationType') : false,
      hasTemplate: !!template,
    };
  }

  // ---- status automation -----------------------------------------------------
  async function maybeMarkDocsReady(application, performedBy) {
    const all = await ApplicationDocument.find({ application: application._id }).select('status source satisfiedBy').lean();
    const byId = new Map(all.map((d) => [String(d._id), d]));
    // "Ready" is driven by the CUSTOMER's part of the file being fully submitted.
    const customerDocs = all.filter((d) => d.source === 'CUSTOMER' && d.status !== 'NOT_APPLICABLE');
    if (!customerDocs.length) return application;
    const allSubmitted = customerDocs.every((d) => effectiveStatus(d, byId) !== 'REQUIRED');
    const earlyStates = ['DRAFT', 'INFO_PENDING', 'INFO_COMPLETE'];
    if (allSubmitted && earlyStates.includes(application.status)) {
      const from = application.status;
      application.status = 'DOCS_READY';
      application.activityLog.push({ action: 'status_changed', fromValue: from, toValue: 'DOCS_READY', performedBy, performedAt: new Date() });
      await application.save();
      notifications?.sendChecklistCompleteToAdmin?.({
        applicationRef: application.applicationRef,
        destinationCountry: application.destinationCountry,
      }).catch?.(() => {});
    }
    return application;
  }

  // ---- shared file upload (customer OR staff) --------------------------------
  function validateFile(file, doc) {
    if (!file) throw new AppError('No file received', 400);
    const accepted = (doc.acceptedMimeTypes && doc.acceptedMimeTypes.length) ? doc.acceptedMimeTypes : Object.keys(MIME_EXT);
    if (!accepted.includes(file.mimetype)) {
      throw new AppError(`This document only accepts: ${accepted.map((m) => MIME_EXT[m] || m).join(', ')}.`, 400);
    }
    if (file.size > MAX_BYTES) throw new AppError('File too large. Maximum size is 15MB.', 400);
  }

  async function applyFileUpload({ doc, application, applicant, file }) {
    const wasRejected = doc.status === 'REJECTED';
    if (doc.cloudinaryPublicId) {
      doc.history.push({
        version: doc.version, status: doc.status, rejectionReason: doc.rejectionReason || '',
        reviewedBy: doc.reviewedBy, cloudinaryPublicId: doc.cloudinaryPublicId,
        originalFilename: doc.originalFilename || '', mimeType: doc.mimeType || '',
        uploadedAt: doc.uploadedAt, reviewedAt: doc.reviewedAt,
      });
    }
    const nextVersion = (doc.version || 0) + 1;
    const subPath = `${application.applicationRef}/${applicant._id}/${doc.docTypeKey}_v${nextVersion}`;
    const saved = await storage.saveAuthenticatedFile(file.buffer, subPath, { resourceType: 'image' });

    doc.cloudinaryPublicId = saved.publicId;
    doc.originalFilename = file.originalname || '';
    doc.mimeType = file.mimetype;
    doc.sizeBytes = file.size;
    doc.version = nextVersion;
    doc.status = 'UPLOADED';
    doc.rejectionReason = '';
    doc.reviewedAt = undefined;
    doc.reviewedBy = undefined;
    doc.uploadedAt = new Date();
    await doc.save();
    return { wasRejected, version: nextVersion };
  }

  // ==========================================================================
  // CUSTOMER
  // ==========================================================================
  async function listMine(userId) {
    const applications = await VisaApplication.find({ user: userId }).sort({ updatedAt: -1 });
    return applications.map((app) => ({
      _id: app._id,
      applicationRef: app.applicationRef,
      destinationCountry: app.destinationCountry,
      packageName: app.packageName,
      status: app.status,
      applicantCount: app.applicantCount,
      appointmentDate: app.appointmentDate,
      intendedTravelDates: app.intendedTravelDates,
      completeness: app.customerCompletenessPercent ?? 0,
      updatedAt: app.updatedAt,
    }));
  }

  async function getMine({ userId, applicationRef }) {
    const application = await loadOwnedApplication(userId, applicationRef);
    return hydrate(application);
  }

  const CUSTOMER_EDITABLE = ['firstName', 'lastName', 'dateOfBirth', 'nationality', 'passportNumber', 'passportExpiry', 'relationshipToPrimary', 'employmentStatus', 'financialSupport', 'sponsorApplicant', 'minorTravellingWith'];
  const ENUM_FIELDS = ['employmentStatus', 'financialSupport', 'minorTravellingWith'];

  function applyApplicantPatch(applicant, patch) {
    for (const key of CUSTOMER_EDITABLE) {
      if (patch[key] !== undefined) applicant[key] = patch[key];
    }
    for (const key of ENUM_FIELDS) if (applicant[key] === '') applicant[key] = null; // '' is not a valid enum value
    if (patch.sponsorApplicant === '' || patch.sponsorApplicant === null) applicant.sponsorApplicant = null;
  }

  async function updateApplicantAsCustomer({ userId, applicationRef, applicantId, patch = {} }) {
    const application = await loadOwnedApplication(userId, applicationRef);
    const applicant = await Applicant.findOne({ _id: applicantId, application: application._id });
    if (!applicant) throw new AppError('Applicant not found', 404);

    applyApplicantPatch(applicant, patch);
    await applicant.save();

    // Answering any rule-driving profile question can (re)seed/reconcile the checklist.
    await reconcileChecklistForApplicant(applicant, application);

    application.lastCustomerActionAt = new Date();
    if (application.status === 'DRAFT') {
      application.status = 'INFO_PENDING';
      application.activityLog.push({ action: 'status_changed', fromValue: 'DRAFT', toValue: 'INFO_PENDING', performedAt: new Date() });
    }
    await application.save();
    await recalcCompleteness(application);
    return applicant;
  }

  // Customer sets application-level answers (accommodation type) — affects everyone.
  async function updateApplicationAsCustomer({ userId, applicationRef, patch = {} }) {
    const application = await loadOwnedApplication(userId, applicationRef);
    if (patch.accommodationType !== undefined) {
      if (!ACCOMMODATION_TYPES.includes(patch.accommodationType)) throw new AppError('Invalid accommodation type', 400);
      application.accommodationType = patch.accommodationType;
    }
    application.lastCustomerActionAt = new Date();
    await application.save();
    await reconcileAllApplicants(application);
    await recalcCompleteness(application);
    return hydrate(application);
  }

  // Customer uploads a document into one of THEIR CUSTOMER-source checklist rows.
  async function uploadDocument({ userId, applicationRef, applicantId, documentId, file }) {
    const application = await loadOwnedApplication(userId, applicationRef);
    const applicant = await Applicant.findOne({ _id: applicantId, application: application._id });
    if (!applicant) throw new AppError('Applicant not found', 404);
    const doc = await ApplicationDocument.findOne({ _id: documentId, applicant: applicant._id });
    if (!doc) throw new AppError('Document not found', 404);
    if (doc.source !== 'CUSTOMER') throw new AppError('This document is handled by our team, not you.', 403);
    if (doc.satisfiedBy) throw new AppError('This document is already provided by another applicant.', 400);
    if (doc.status === 'NOT_APPLICABLE') throw new AppError('This document is not required for this applicant', 400);
    validateFile(file, doc);

    const { wasRejected } = await applyFileUpload({ doc, application, applicant, file });

    application.lastCustomerActionAt = new Date();
    application.activityLog.push({ action: 'document_uploaded', toValue: `${doc.docTypeKey} (v${doc.version})`, performedAt: new Date() });
    if (wasRejected) { application.rejectionReminderCount = 0; application.lastRejectionReminderAt = undefined; }
    await application.save();

    await maybeMarkDocsReady(application);
    await recalcCompleteness(application);
    return doc;
  }

  // ---- signed URL / stream (customer OR admin) ------------------------------
  async function resolveDocumentTarget({ documentId, requester, version }) {
    const doc = await ApplicationDocument.findById(documentId);
    if (!doc) throw new AppError('Document not found', 404);

    // A satisfied row has no file of its own — read the source document instead.
    const fileDoc = doc.satisfiedBy ? await ApplicationDocument.findById(doc.satisfiedBy) : doc;
    if (!fileDoc) throw new AppError('Document not found', 404);

    if (!requester?.isAdmin) {
      const application = await VisaApplication.findById(doc.application).select('user').lean();
      if (!application || String(application.user) !== String(requester?.userId)) throw new AppError('Document not found', 404);
    }

    let target = { cloudinaryPublicId: fileDoc.cloudinaryPublicId, mimeType: fileDoc.mimeType, originalFilename: fileDoc.originalFilename, version: fileDoc.version };
    const wantVersion = version != null && version !== '' ? Number(version) : null;
    if (wantVersion != null && wantVersion !== fileDoc.version) {
      const past = (fileDoc.history || []).find((h) => h.version === wantVersion);
      if (!past || !past.cloudinaryPublicId) throw new AppError('Document version not found', 404);
      target = { cloudinaryPublicId: past.cloudinaryPublicId, mimeType: past.mimeType, originalFilename: past.originalFilename, version: past.version };
    }
    if (!target.cloudinaryPublicId) throw new AppError('No file has been uploaded yet', 404);
    return target;
  }

  async function getSignedDocumentUrl({ documentId, requester, version }) {
    const target = await resolveDocumentTarget({ documentId, requester, version });
    const format = MIME_EXT[target.mimeType] || undefined;
    const url = storage.signSecureUrl(target.cloudinaryPublicId, 300, { resourceType: 'image', format });
    return { url, expiresInSeconds: 300, filename: target.originalFilename, mimeType: target.mimeType, version: target.version };
  }

  async function streamDocument({ documentId, requester, version }) {
    const target = await resolveDocumentTarget({ documentId, requester, version });
    const format = MIME_EXT[target.mimeType] || undefined;
    const url = storage.signSecureUrl(target.cloudinaryPublicId, 300, { resourceType: 'image', format });
    const resp = await fetch(url);
    if (!resp.ok || !resp.body) throw new AppError('Could not retrieve document from storage', 502);
    return { body: resp.body, mimeType: target.mimeType || 'application/octet-stream', filename: target.originalFilename || 'document', version: target.version };
  }

  // ==========================================================================
  // ADMIN — application list / detail
  // ==========================================================================
  const ACTIVE_STATES = ['DRAFT', 'INFO_PENDING', 'INFO_COMPLETE', 'DOCS_READY'];
  const QUEUE_FILTERS = ['all', 'needs_review', 'your_turn', 'gone_quiet', 'escalated', 'rejected_pending', 'ready_to_submit'];

  async function adminList({ page, limit, status, assignedTo, search, queue = 'all' }) {
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    if (queue && !QUEUE_FILTERS.includes(queue)) throw new AppError('Invalid queue filter', 400);

    const docColl = ApplicationDocument.collection.name;
    const userColl = User.collection.name;
    const adminColl = VisaApplication.db.model('admin-user').collection.name;
    const now = Date.now();
    const fiveDaysAgo = new Date(now - 5 * 86400000);

    const baseMatch = {};
    if (status && status !== 'all') {
      if (!APPLICATION_STATUSES.includes(status)) throw new AppError('Invalid status filter', 400);
      baseMatch.status = status;
    }
    if (assignedTo === 'unassigned') baseMatch.assignedTo = { $exists: false };
    else if (assignedTo && assignedTo !== 'all') baseMatch.assignedTo = new mongoose.Types.ObjectId(String(assignedTo));
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      baseMatch.$or = [{ applicationRef: regex }, { destinationCountry: regex }];
    }
    if (queue === 'escalated') baseMatch.reminderState = 'ESCALATED';
    // Stored-field queues (fast — no doc lookup needed).
    if (queue === 'ready_to_submit') baseMatch.readyToSubmit = true;
    if (queue === 'your_turn') { baseMatch.customerCompletenessPercent = 100; baseMatch.fileCompletenessPercent = { $lt: 100 }; }

    const pipeline = [
      { $match: baseMatch },
      { $addFields: { effectiveLastAction: { $ifNull: ['$lastCustomerActionAt', '$createdAt'] } } },
    ];
    if (queue === 'gone_quiet') {
      pipeline.push({ $match: { effectiveLastAction: { $lt: fiveDaysAgo }, status: { $in: ACTIVE_STATES } } });
    }
    pipeline.push(
      { $lookup: { from: docColl, localField: '_id', foreignField: 'application', as: 'docs' } },
      {
        $addFields: {
          rejectedCount: { $size: { $filter: { input: '$docs', as: 'd', cond: { $eq: ['$$d.status', 'REJECTED'] } } } },
          uploadedCount: { $size: { $filter: { input: '$docs', as: 'd', cond: { $eq: ['$$d.status', 'UPLOADED'] } } } },
        },
      },
    );
    if (queue === 'needs_review') pipeline.push({ $match: { uploadedCount: { $gt: 0 } } });
    if (queue === 'rejected_pending') pipeline.push({ $match: { rejectedCount: { $gt: 0 } } });
    // "Your turn" apps are sorted by how long the completed customer has been waiting
    // on staff, NOT by customer silence (which is misleading — they're finished).
    const sortStage = queue === 'your_turn' ? { $sort: { customerCompletedAt: 1 } } : { $sort: { effectiveLastAction: 1 } };
    pipeline.push(
      sortStage,
      {
        $facet: {
          meta: [{ $count: 'total' }],
          rows: [
            { $skip: (currentPage - 1) * pageSize },
            { $limit: pageSize },
            { $lookup: { from: userColl, localField: 'user', foreignField: '_id', as: 'userDoc' } },
            { $lookup: { from: adminColl, localField: 'assignedTo', foreignField: '_id', as: 'assigneeDoc' } },
            {
              $project: {
                applicationRef: 1, destinationCountry: 1, status: 1,
                reminderState: 1, reminderCount: 1, rejectedCount: 1, uploadedCount: 1,
                completeness: '$fileCompletenessPercent',
                customerCompleteness: '$customerCompletenessPercent',
                readyToSubmit: 1, customerCompletedAt: 1,
                lastCustomerActionAt: 1, effectiveLastAction: 1, createdAt: 1,
                user: { $let: { vars: { u: { $arrayElemAt: ['$userDoc', 0] } }, in: { firstName: '$$u.firstName', lastName: '$$u.lastName', email: '$$u.email' } } },
                assignedTo: { $let: { vars: { a: { $arrayElemAt: ['$assigneeDoc', 0] } }, in: { name: '$$a.name', email: '$$a.email' } } },
              },
            },
          ],
        },
      },
    );

    const [faceted] = await VisaApplication.aggregate(pipeline);
    const total = faceted?.meta?.[0]?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const rows = (faceted?.rows ?? []).map((app) => {
      const anchor = app.effectiveLastAction || app.createdAt;
      return {
        ...app,
        hasRejected: (app.rejectedCount || 0) > 0,
        daysSinceLastCustomerAction: app.lastCustomerActionAt ? Math.floor((now - new Date(app.lastCustomerActionAt).getTime()) / 86400000) : null,
        daysQuiet: anchor ? Math.floor((now - new Date(anchor).getTime()) / 86400000) : null,
        daysSinceCustomerCompleted: app.customerCompletedAt ? Math.floor((now - new Date(app.customerCompletedAt).getTime()) / 86400000) : null,
      };
    });

    const [summaryTotal, underReview, approved, escalated] = await Promise.all([
      VisaApplication.countDocuments({}),
      VisaApplication.countDocuments({ status: 'DOCS_READY' }),
      VisaApplication.countDocuments({ status: 'APPROVED' }),
      VisaApplication.countDocuments({ reminderState: 'ESCALATED' }),
    ]);

    return {
      applications: rows,
      summary: { total: summaryTotal, underReview, approved, escalated },
      pagination: { page: currentPage, limit: pageSize, total, totalPages, hasNextPage: currentPage < totalPages, hasPrevPage: currentPage > 1 },
    };
  }

  async function adminGetById(id) {
    const application = await VisaApplication.findById(id)
      .populate('user', 'firstName lastName email')
      .populate('assignedTo', 'name email')
      .populate('visaLead', 'firstName lastName email')
      .populate('notes.createdBy', 'name email')
      .populate('activityLog.performedBy', 'name email');
    if (!application) throw new AppError('Application not found', 404);
    return hydrate(application);
  }

  async function resolveUser({ email, firstName = '', lastName = '' }) {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized) throw new AppError('A customer email is required', 400);
    let user = await User.findOne({ email: normalized });
    if (!user) {
      user = await User.create({ email: normalized, firstName, lastName, password: crypto.randomBytes(24).toString('hex') });
    }
    return user;
  }

  async function adminCreate({ visaLeadId, email, firstName, lastName, destinationCountry, packageName, applicantCount, intendedTravelDates, primaryApplicant, visaTypeKey, accommodationType, performedBy }) {
    let lead = null;
    if (visaLeadId) {
      const VisaLead = VisaApplication.db.model('VisaLead');
      lead = await VisaLead.findById(visaLeadId).lean();
      if (!lead) throw new AppError('Visa lead not found', 404);
    }

    const customerEmail = email || lead?.email;
    const user = await resolveUser({ email: customerEmail, firstName: firstName || lead?.firstName || '', lastName: lastName || lead?.lastName || '' });

    const ref = await generateApplicationRef();
    const application = await VisaApplication.create({
      applicationRef: ref,
      user: user._id,
      visaLead: lead?._id || null,
      destinationCountry: destinationCountry || lead?.visaCountryName || 'Schengen',
      packageName: packageName || lead?.packageRequested || '',
      applicantCount: applicantCount || lead?.applicantCount || 1,
      intendedTravelDates: intendedTravelDates || {},
      visaTypeKey: (visaTypeKey || 'SCHENGEN').toUpperCase(),
      accommodationType: ACCOMMODATION_TYPES.includes(accommodationType) ? accommodationType : 'HOTEL',
      assignedTo: performedBy || undefined,
      status: user ? 'INFO_PENDING' : 'DRAFT',
    });

    await addApplicant({
      application,
      isPrimary: true,
      data: {
        firstName: primaryApplicant?.firstName || lead?.firstName || '',
        lastName: primaryApplicant?.lastName || lead?.lastName || '',
        nationality: primaryApplicant?.nationality || lead?.nationality || '',
        employmentStatus: primaryApplicant?.employmentStatus || null,
      },
    });

    const magicLinkUrl = await buildMagicLink(user);
    notifications?.sendApplicationAssigned?.({
      email: user.email, applicationRef: application.applicationRef, destinationCountry: application.destinationCountry, magicLinkUrl,
    }).catch?.(() => {});

    return application;
  }

  async function adminAddApplicant({ applicationId, applicantData, performedBy }) {
    const application = await VisaApplication.findById(applicationId);
    if (!application) throw new AppError('Application not found', 404);
    const applicant = await addApplicant({ application, data: applicantData || {}, isPrimary: false });
    application.activityLog.push({ action: 'applicant_added', toValue: `${applicant.firstName} ${applicant.lastName}`.trim(), performedBy, performedAt: new Date() });
    await application.save();
    await recalcCompleteness(application);
    return applicant;
  }

  async function adminUpdateApplicant({ applicationId, applicantId, patch = {}, performedBy }) {
    const application = await VisaApplication.findById(applicationId);
    if (!application) throw new AppError('Application not found', 404);
    const applicant = await Applicant.findOne({ _id: applicantId, application: application._id });
    if (!applicant) throw new AppError('Applicant not found', 404);

    applyApplicantPatch(applicant, patch);
    await applicant.save();
    await reconcileChecklistForApplicant(applicant, application);

    application.activityLog.push({ action: 'applicant_updated', toValue: `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim(), performedBy, performedAt: new Date() });
    await application.save();
    await recalcCompleteness(application);
    return applicant;
  }

  async function adminUpdate({ id, patch = {}, performedBy }) {
    const application = await VisaApplication.findById(id);
    if (!application) throw new AppError('Application not found', 404);
    let reconcileNeeded = false;

    if (patch.status !== undefined) {
      if (!APPLICATION_STATUSES.includes(patch.status)) throw new AppError('Invalid status', 400);
      if (patch.status !== application.status) {
        application.activityLog.push({ action: 'status_changed', fromValue: application.status, toValue: patch.status, performedBy, performedAt: new Date() });
        application.status = patch.status;
      }
    }
    if (patch.assignedTo !== undefined) {
      const from = application.assignedTo?.toString() || 'unassigned';
      application.assignedTo = patch.assignedTo || undefined;
      application.activityLog.push({ action: 'assigned', fromValue: from, toValue: patch.assignedTo || 'unassigned', performedBy, performedAt: new Date() });
    }
    if (patch.reminderState !== undefined) {
      if (!['ACTIVE', 'PAUSED'].includes(patch.reminderState)) throw new AppError('reminderState must be ACTIVE or PAUSED', 400);
      if (patch.reminderState !== application.reminderState) {
        application.activityLog.push({ action: `reminders_${patch.reminderState === 'PAUSED' ? 'paused' : 'resumed'}`, performedBy, performedAt: new Date() });
        application.reminderState = patch.reminderState;
      }
    }
    if (patch.accommodationType !== undefined) {
      if (!ACCOMMODATION_TYPES.includes(patch.accommodationType)) throw new AppError('Invalid accommodation type', 400);
      if (patch.accommodationType !== application.accommodationType) { application.accommodationType = patch.accommodationType; reconcileNeeded = true; }
    }
    if (patch.visaTypeKey !== undefined && String(patch.visaTypeKey).toUpperCase() !== application.visaTypeKey) {
      application.visaTypeKey = String(patch.visaTypeKey).toUpperCase();
      reconcileNeeded = true;
    }
    if (patch.vfsCenter !== undefined) application.vfsCenter = patch.vfsCenter;
    if (patch.appointmentDate !== undefined) application.appointmentDate = patch.appointmentDate || undefined;
    if (patch.appointmentStatus !== undefined) {
      if (!APPOINTMENT_STATUSES.includes(patch.appointmentStatus)) throw new AppError('Invalid appointment status', 400);
      application.appointmentStatus = patch.appointmentStatus;
    }
    if (patch.destinationCountry !== undefined) application.destinationCountry = patch.destinationCountry;
    if (patch.packageName !== undefined) application.packageName = patch.packageName;
    if (patch.intendedTravelDates !== undefined) { application.intendedTravelDates = patch.intendedTravelDates; reconcileNeeded = true; }
    if (patch.externalOrders && typeof patch.externalOrders === 'object') {
      const eo = patch.externalOrders;
      if (eo.dummyTicketRef !== undefined) application.externalOrders.dummyTicketRef = String(eo.dummyTicketRef).trim();
      if (eo.hotelBookingRef !== undefined) application.externalOrders.hotelBookingRef = String(eo.hotelBookingRef).trim();
      if (eo.insuranceSessionId !== undefined) application.externalOrders.insuranceSessionId = String(eo.insuranceSessionId).trim();
    }

    await application.save();
    if (reconcileNeeded) { await reconcileAllApplicants(application); await recalcCompleteness(application); }
    return application;
  }

  async function adminAddNote({ id, text, performedBy }) {
    if (!text?.trim()) throw new AppError('Note text is required', 400);
    if (text.trim().length > 2000) throw new AppError('Note text must be 2000 characters or fewer', 400);
    const application = await VisaApplication.findById(id);
    if (!application) throw new AppError('Application not found', 404);
    application.notes.push({ text: text.trim(), createdBy: performedBy, createdAt: new Date() });
    application.activityLog.push({ action: 'note_added', performedBy, performedAt: new Date() });
    await application.save();
    return application;
  }

  async function adminReviewDocument({ documentId, decision, rejectionReason, reviewedBy }) {
    if (!['APPROVED', 'REJECTED'].includes(decision)) throw new AppError('Decision must be APPROVED or REJECTED', 400);
    if (decision === 'REJECTED' && !rejectionReason?.trim()) throw new AppError('A rejection reason is required', 400);

    const doc = await ApplicationDocument.findById(documentId);
    if (!doc) throw new AppError('Document not found', 404);
    if (doc.satisfiedBy) throw new AppError('Review the source document instead — this row is satisfied by another.', 400);
    if (doc.status === 'REQUIRED') throw new AppError('Cannot review a document that has not been uploaded', 400);

    doc.status = decision;
    doc.rejectionReason = decision === 'REJECTED' ? rejectionReason.trim() : '';
    doc.reviewedAt = new Date();
    doc.reviewedBy = reviewedBy;
    await doc.save();

    const application = await VisaApplication.findById(doc.application);
    application.activityLog.push({ action: `document_${decision.toLowerCase()}`, toValue: doc.docTypeKey, performedBy: reviewedBy, performedAt: new Date() });
    if (decision === 'REJECTED') { application.rejectionReminderCount = 0; application.lastRejectionReminderAt = undefined; }
    await application.save();
    await recalcCompleteness(application);

    const user = await User.findById(application.user).select('email').lean();
    const base = String(appBaseUrl || '').replace(/\/+$/, '');
    if (decision === 'REJECTED') {
      notifications?.sendDocumentRejected?.({
        email: user?.email, applicationRef: application.applicationRef, docType: doc.docTypeKey,
        rejectionReason: doc.rejectionReason, link: `${base}/apply/${application.applicationRef}`,
      }).catch?.(() => {});
    } else {
      // Every APPLICABLE row effectively APPROVED → tell the customer we're preparing.
      const all = await ApplicationDocument.find({ application: application._id }).select('status satisfiedBy').lean();
      const byId = new Map(all.map((d) => [String(d._id), d]));
      const applicable = all.filter((d) => d.status !== 'NOT_APPLICABLE');
      if (applicable.length && applicable.every((d) => effectiveStatus(d, byId) === 'APPROVED')) {
        notifications?.sendAllDocumentsApproved?.({
          email: user?.email, applicationRef: application.applicationRef, destinationCountry: application.destinationCountry,
          link: `${base}/apply/${application.applicationRef}`,
        }).catch?.(() => {});
      }
    }
    return doc;
  }

  // ==========================================================================
  // ADMIN — document-level actions
  // ==========================================================================
  async function loadAdminDoc(documentId) {
    const doc = await ApplicationDocument.findById(documentId);
    if (!doc) throw new AppError('Document not found', 404);
    const application = await VisaApplication.findById(doc.application);
    if (!application) throw new AppError('Application not found', 404);
    return { doc, application };
  }

  // Staff upload for AGENT (or, on behalf, CUSTOMER) rows — same storage/history path.
  async function adminUploadDocument({ documentId, file, performedBy }) {
    const { doc, application } = await loadAdminDoc(documentId);
    if (doc.source === 'IN_PERSON') throw new AppError('In-person items are marked complete, not uploaded.', 400);
    if (doc.satisfiedBy) throw new AppError('This row is satisfied by another applicant\'s document.', 400);
    const applicant = await Applicant.findById(doc.applicant);
    if (!applicant) throw new AppError('Applicant not found', 404);
    // Enrich acceptedMimeTypes from the DocumentType for validation.
    const type = await DocumentType.findById(doc.documentType).lean();
    validateFile(file, { acceptedMimeTypes: type?.acceptedMimeTypes });

    await applyFileUpload({ doc, application, applicant, file });
    application.activityLog.push({ action: 'staff_document_uploaded', toValue: `${doc.docTypeKey} (v${doc.version})`, performedBy, performedAt: new Date() });
    await application.save();
    await recalcCompleteness(application);
    return doc;
  }

  // Mark an IN_PERSON row complete (no file), with an optional note.
  async function adminMarkInPerson({ documentId, note, performedBy }) {
    const { doc, application } = await loadAdminDoc(documentId);
    if (doc.source !== 'IN_PERSON') throw new AppError('Only in-person items can be marked complete this way.', 400);
    doc.status = 'APPROVED';
    doc.note = (note || '').trim();
    doc.reviewedAt = new Date();
    doc.reviewedBy = performedBy;
    await doc.save();
    application.activityLog.push({ action: 'in_person_completed', toValue: doc.docTypeKey, performedBy, performedAt: new Date() });
    await application.save();
    await recalcCompleteness(application);
    return doc;
  }

  // Link a row to another applicant's uploaded document in the SAME application.
  async function adminLinkSatisfiedBy({ documentId, sourceDocumentId, performedBy }) {
    const { doc, application } = await loadAdminDoc(documentId);
    if (!sourceDocumentId) {
      // Unlink.
      doc.satisfiedBy = null;
      doc.status = doc.cloudinaryPublicId ? 'UPLOADED' : 'REQUIRED';
      await doc.save();
      application.activityLog.push({ action: 'document_unlinked', toValue: doc.docTypeKey, performedBy, performedAt: new Date() });
      await application.save();
      await recalcCompleteness(application);
      return doc;
    }
    const source = await ApplicationDocument.findById(sourceDocumentId);
    if (!source) throw new AppError('Source document not found', 404);
    if (String(source.application) !== String(application._id)) throw new AppError('Both documents must belong to the same application', 400);
    if (String(source._id) === String(doc._id)) throw new AppError('A document cannot satisfy itself', 400);
    if (source.satisfiedBy) throw new AppError('Cannot link to a row that is itself satisfied by another document', 400);
    if (!source.cloudinaryPublicId) throw new AppError('The source document has no uploaded file yet', 400);

    doc.satisfiedBy = source._id;
    doc.status = 'UPLOADED'; // "provided"; effective status derives from the source
    // A satisfied row keeps no file of its own.
    doc.cloudinaryPublicId = '';
    doc.originalFilename = '';
    doc.mimeType = '';
    doc.sizeBytes = 0;
    doc.rejectionReason = '';
    await doc.save();
    application.activityLog.push({ action: 'document_linked', toValue: `${doc.docTypeKey} ← ${source.docTypeKey}`, performedBy, performedAt: new Date() });
    await application.save();
    await recalcCompleteness(application);
    return doc;
  }

  // Add a manual document row to an applicant (outside the template).
  async function adminAddDocumentRow({ applicationId, applicantId, docTypeKey, performedBy }) {
    const application = await VisaApplication.findById(applicationId);
    if (!application) throw new AppError('Application not found', 404);
    const applicant = await Applicant.findOne({ _id: applicantId, application: application._id });
    if (!applicant) throw new AppError('Applicant not found', 404);
    const type = await DocumentType.findOne({ key: String(docTypeKey || '').toUpperCase() }).lean();
    if (!type) throw new AppError('Unknown document type', 400);

    const existing = await ApplicationDocument.findOne({ applicant: applicant._id, docTypeKey: type.key });
    if (existing) {
      if (existing.status === 'NOT_APPLICABLE') { existing.status = 'REQUIRED'; existing.addedManually = true; await existing.save(); }
      else throw new AppError('This applicant already has that document row', 409);
      await recalcCompleteness(application);
      return existing;
    }
    const doc = await ApplicationDocument.create({
      application: application._id, applicant: applicant._id, documentType: type._id,
      docTypeKey: type.key, source: type.source, status: 'REQUIRED', addedManually: true,
    });
    application.activityLog.push({ action: 'document_added', toValue: type.key, performedBy, performedAt: new Date() });
    await application.save();
    await recalcCompleteness(application);
    return doc;
  }

  // Waive/remove a row. Optional or manual rows can be removed; a template row is
  // waived to NOT_APPLICABLE, a manually-added row is deleted outright.
  async function adminRemoveDocumentRow({ documentId, performedBy }) {
    const { doc, application } = await loadAdminDoc(documentId);
    if (doc.addedManually) {
      await ApplicationDocument.deleteOne({ _id: doc._id });
      application.activityLog.push({ action: 'document_removed', toValue: doc.docTypeKey, performedBy, performedAt: new Date() });
    } else {
      doc.status = 'NOT_APPLICABLE';
      await doc.save();
      application.activityLog.push({ action: 'document_waived', toValue: doc.docTypeKey, performedBy, performedAt: new Date() });
    }
    await application.save();
    await recalcCompleteness(application);
    return { ok: true };
  }

  return {
    // customer
    listMine,
    getMine,
    updateApplicantAsCustomer,
    updateApplicationAsCustomer,
    uploadDocument,
    getSignedDocumentUrl,
    streamDocument,
    // admin — applications
    adminList,
    adminGetById,
    adminCreate,
    adminAddApplicant,
    adminUpdateApplicant,
    adminUpdate,
    adminAddNote,
    adminReviewDocument,
    // admin — documents
    adminUploadDocument,
    adminMarkInPerson,
    adminLinkSatisfiedBy,
    adminAddDocumentRow,
    adminRemoveDocumentRow,
  };
}
