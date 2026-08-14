import { Readable } from 'node:stream';
import { catchAsync, AppError } from '@travel-suite/utils';

function pipeInline(res, { body, mimeType, filename }) {
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${String(filename).replace(/["\r\n]/g, '')}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  Readable.fromWeb(body).pipe(res);
}

export function createVisaApplicationController({ service, registry, reminders }) {
  // ---- CUSTOMER (userJwt) ---------------------------------------------------
  const listMine = catchAsync(async (req, res) => {
    const applications = await service.listMine(req.user._id);
    res.status(200).json({ status: 'success', results: applications.length, data: { applications } });
  });

  const getMine = catchAsync(async (req, res) => {
    const application = await service.getMine({ userId: req.user._id, applicationRef: req.params.applicationRef });
    res.status(200).json({ status: 'success', data: { application } });
  });

  const updateApplication = catchAsync(async (req, res) => {
    const application = await service.updateApplicationAsCustomer({ userId: req.user._id, applicationRef: req.params.applicationRef, patch: req.body });
    res.status(200).json({ status: 'success', message: 'Application updated', data: { application } });
  });

  const updateApplicant = catchAsync(async (req, res) => {
    const applicant = await service.updateApplicantAsCustomer({
      userId: req.user._id,
      applicationRef: req.params.applicationRef,
      applicantId: req.params.applicantId,
      patch: req.body,
    });
    res.status(200).json({ status: 'success', message: 'Applicant updated', data: { applicant } });
  });

  const uploadDocument = catchAsync(async (req, res) => {
    if (!req.body.documentId) throw new AppError('documentId is required', 400);
    const doc = await service.uploadDocument({
      userId: req.user._id,
      applicationRef: req.params.applicationRef,
      applicantId: req.params.applicantId,
      documentId: req.body.documentId,
      file: req.file,
    });
    res.status(201).json({ status: 'success', message: 'Document uploaded', data: { document: doc } });
  });

  const viewDocument = catchAsync(async (req, res) => {
    const signed = await service.getSignedDocumentUrl({
      documentId: req.params.documentId,
      requester: { userId: req.user._id },
      version: req.query.version,
    });
    res.status(200).json({ status: 'success', data: signed });
  });

  // Inline stream (customer). Same ownership + version checks as the signed URL.
  const streamDocument = catchAsync(async (req, res) => {
    const data = await service.streamDocument({
      documentId: req.params.documentId,
      requester: { userId: req.user._id },
      version: req.query.version,
    });
    pipeInline(res, data);
  });

  // ---- ADMIN (restrictTo 'admin','agent') -----------------------------------
  const adminList = catchAsync(async (req, res) => {
    const { page = 1, limit = 20, status, assignedTo, search } = req.query;
    const result = await service.adminList({ page, limit, status, assignedTo, search });
    res.status(200).json({ status: 'success', results: result.applications.length, data: result });
  });

  const adminCreate = catchAsync(async (req, res) => {
    const application = await service.adminCreate({ ...req.body, performedBy: req.user._id });
    res.status(201).json({ status: 'success', message: 'Application created', data: { application } });
  });

  const adminGetById = catchAsync(async (req, res) => {
    const application = await service.adminGetById(req.params.id);
    res.status(200).json({ status: 'success', data: { application } });
  });

  const adminUpdate = catchAsync(async (req, res) => {
    const application = await service.adminUpdate({ id: req.params.id, patch: req.body, performedBy: req.user._id });
    res.status(200).json({ status: 'success', message: 'Application updated', data: { application } });
  });

  const adminAddApplicant = catchAsync(async (req, res) => {
    const applicant = await service.adminAddApplicant({ applicationId: req.params.id, applicantData: req.body, performedBy: req.user._id });
    res.status(201).json({ status: 'success', message: 'Applicant added', data: { applicant } });
  });

  const adminUpdateApplicant = catchAsync(async (req, res) => {
    const applicant = await service.adminUpdateApplicant({ applicationId: req.params.id, applicantId: req.params.applicantId, patch: req.body, performedBy: req.user._id });
    res.status(200).json({ status: 'success', message: 'Applicant updated', data: { applicant } });
  });

  const adminReviewDocument = catchAsync(async (req, res) => {
    const doc = await service.adminReviewDocument({
      documentId: req.params.documentId,
      decision: req.body.decision,
      rejectionReason: req.body.rejectionReason,
      reviewedBy: req.user._id,
    });
    res.status(200).json({ status: 'success', message: 'Document reviewed', data: { document: doc } });
  });

  const adminViewDocument = catchAsync(async (req, res) => {
    const signed = await service.getSignedDocumentUrl({ documentId: req.params.documentId, requester: { isAdmin: true }, version: req.query.version });
    res.status(200).json({ status: 'success', data: signed });
  });

  // Inline stream (admin). Same admin check as the admin signed URL.
  const adminStreamDocument = catchAsync(async (req, res) => {
    const data = await service.streamDocument({ documentId: req.params.documentId, requester: { isAdmin: true }, version: req.query.version });
    pipeInline(res, data);
  });

  // Manual reminder sweep (admin only). `?dryRun=1` reports without sending.
  const adminRunReminders = catchAsync(async (req, res) => {
    const dryRun = ['1', 'true', 'yes'].includes(String(req.query.dryRun || '').toLowerCase());
    const summary = await reminders.runReminderSweep({ dryRun });
    res.status(200).json({ status: 'success', data: { summary } });
  });

  const adminAddNote = catchAsync(async (req, res) => {
    const application = await service.adminAddNote({ id: req.params.id, text: req.body.text, performedBy: req.user._id });
    res.status(200).json({ status: 'success', message: 'Note added', data: { application } });
  });

  // ---- ADMIN document-level actions ----------------------------------------
  const adminUploadDocument = catchAsync(async (req, res) => {
    const doc = await service.adminUploadDocument({ documentId: req.params.documentId, file: req.file, performedBy: req.user._id });
    res.status(201).json({ status: 'success', message: 'Document uploaded', data: { document: doc } });
  });

  const adminMarkInPerson = catchAsync(async (req, res) => {
    const doc = await service.adminMarkInPerson({ documentId: req.params.documentId, note: req.body.note, performedBy: req.user._id });
    res.status(200).json({ status: 'success', message: 'Marked complete', data: { document: doc } });
  });

  const adminLinkSatisfiedBy = catchAsync(async (req, res) => {
    const doc = await service.adminLinkSatisfiedBy({ documentId: req.params.documentId, sourceDocumentId: req.body.sourceDocumentId, performedBy: req.user._id });
    res.status(200).json({ status: 'success', message: 'Document linked', data: { document: doc } });
  });

  const adminAddDocumentRow = catchAsync(async (req, res) => {
    const doc = await service.adminAddDocumentRow({ applicationId: req.params.id, applicantId: req.params.applicantId, docTypeKey: req.body.docTypeKey, performedBy: req.user._id });
    res.status(201).json({ status: 'success', message: 'Document row added', data: { document: doc } });
  });

  const adminRemoveDocumentRow = catchAsync(async (req, res) => {
    await service.adminRemoveDocumentRow({ documentId: req.params.documentId, performedBy: req.user._id });
    res.status(200).json({ status: 'success', message: 'Document row removed' });
  });

  // ---- ADMIN registry CRUD (restrictTo('admin')) ---------------------------
  const listDocumentTypes = catchAsync(async (_req, res) => {
    const documentTypes = await registry.listDocumentTypes();
    res.status(200).json({ status: 'success', data: { documentTypes } });
  });
  const createDocumentType = catchAsync(async (req, res) => {
    const documentType = await registry.createDocumentType(req.body);
    res.status(201).json({ status: 'success', data: { documentType } });
  });
  const updateDocumentType = catchAsync(async (req, res) => {
    const documentType = await registry.updateDocumentType(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: { documentType } });
  });
  const listTemplates = catchAsync(async (_req, res) => {
    const templates = await registry.listTemplates();
    res.status(200).json({ status: 'success', data: { templates } });
  });
  const getTemplate = catchAsync(async (req, res) => {
    const template = await registry.getTemplate(req.params.id);
    res.status(200).json({ status: 'success', data: { template } });
  });
  const upsertTemplate = catchAsync(async (req, res) => {
    const template = await registry.upsertTemplate(req.body);
    res.status(200).json({ status: 'success', data: { template } });
  });
  const previewTemplate = catchAsync(async (req, res) => {
    const preview = await registry.previewTemplate(req.body?.rules);
    res.status(200).json({ status: 'success', data: preview });
  });
  const updateTemplate = catchAsync(async (req, res) => {
    const template = await registry.updateTemplate(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: { template } });
  });

  return {
    listMine,
    getMine,
    updateApplication,
    updateApplicant,
    uploadDocument,
    viewDocument,
    streamDocument,
    adminStreamDocument,
    adminList,
    adminCreate,
    adminGetById,
    adminUpdate,
    adminAddApplicant,
    adminUpdateApplicant,
    adminReviewDocument,
    adminViewDocument,
    adminAddNote,
    adminRunReminders,
    adminUploadDocument,
    adminMarkInPerson,
    adminLinkSatisfiedBy,
    adminAddDocumentRow,
    adminRemoveDocumentRow,
    listDocumentTypes,
    createDocumentType,
    updateDocumentType,
    listTemplates,
    getTemplate,
    upsertTemplate,
    previewTemplate,
    updateTemplate,
  };
}
