import VisaApplicationSchema from './schemas/visaApplication.schema.js';
import ApplicantSchema from './schemas/applicant.schema.js';
import ApplicationDocumentSchema from './schemas/applicationDocument.schema.js';
import DocumentTypeSchema from './schemas/documentType.schema.js';
import ChecklistTemplateSchema from './schemas/checklistTemplate.schema.js';
import { createVisaApplicationService } from './service.js';
import { createRegistryService } from './registry.service.js';
import { createVisaApplicationController } from './controller.js';
import { createVisaApplicationRouterFromParts } from './router.js';
import { createReminderEngine } from './reminders.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

/**
 * @param {{
 *   db: import('mongoose').Connection,
 *   auth: { protect, restrictTo },        // admin auth
 *   userAuth: { protect },                // customer (userJwt) auth
 *   User: import('mongoose').Model,       // customer model (from the users domain)
 *   storage,                              // cloudinary storage with authenticated helpers
 *   notifications,
 *   apiBaseUrl?: string, appBaseUrl?: string,
 * }} deps
 */
export function createVisaApplicationsRouter({ db, auth, userAuth, User, storage, notifications, apiBaseUrl, appBaseUrl, logger }) {
  const VisaApplication = getOrRegisterModel(db, 'visa-application', VisaApplicationSchema);
  const Applicant = getOrRegisterModel(db, 'applicant', ApplicantSchema);
  const ApplicationDocument = getOrRegisterModel(db, 'application-document', ApplicationDocumentSchema);
  const DocumentType = getOrRegisterModel(db, 'document-type', DocumentTypeSchema);
  const ChecklistTemplate = getOrRegisterModel(db, 'checklist-template', ChecklistTemplateSchema);

  const service = createVisaApplicationService({
    VisaApplication,
    Applicant,
    ApplicationDocument,
    DocumentType,
    ChecklistTemplate,
    User,
    storage,
    notifications,
    apiBaseUrl,
    appBaseUrl,
  });

  const registry = createRegistryService({ DocumentType, ChecklistTemplate });

  // Reminder engine — same models. Track A/B only chase CUSTOMER-source rows.
  const reminders = createReminderEngine({
    VisaApplication,
    Applicant,
    ApplicationDocument,
    DocumentType,
    User,
    notifications,
    appBaseUrl,
    logger,
  });

  const controller = createVisaApplicationController({ service, registry, reminders });
  const router = createVisaApplicationRouterFromParts({ controller, auth, userAuth });

  return {
    router,
    service,
    registry,
    runReminderSweep: reminders.runReminderSweep,
    VisaApplication,
    Applicant,
    ApplicationDocument,
    DocumentType,
    ChecklistTemplate,
  };
}

export { default as VisaApplicationSchema } from './schemas/visaApplication.schema.js';
export { default as ApplicantSchema } from './schemas/applicant.schema.js';
export { default as ApplicationDocumentSchema } from './schemas/applicationDocument.schema.js';
export { default as DocumentTypeSchema } from './schemas/documentType.schema.js';
export { default as ChecklistTemplateSchema } from './schemas/checklistTemplate.schema.js';
export * from './matcher.js';
