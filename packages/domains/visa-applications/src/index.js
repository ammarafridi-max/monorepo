import VisaApplicationSchema from './schemas/visa-application.schema.js';
import ApplicantSchema from './schemas/applicant.schema.js';
import ApplicationDocumentSchema from './schemas/application-document.schema.js';
import DocumentTypeSchema from './schemas/document-type.schema.js';
import ChecklistTemplateSchema from './schemas/checklist-template.schema.js';
import { createVisaApplicationService } from './service.js';
import { createRegistryService } from './registry.service.js';
import { createVisaApplicationController } from './controller.js';
import { createVisaApplicationRouterFromParts } from './router.js';
import { createReminderEngine } from './reminders.js';
import { getOrRegisterModel } from '@travel-suite/utils/model';


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

export { default as VisaApplicationSchema } from './schemas/visa-application.schema.js';
export { default as ApplicantSchema } from './schemas/applicant.schema.js';
export { default as ApplicationDocumentSchema } from './schemas/application-document.schema.js';
export { default as DocumentTypeSchema } from './schemas/document-type.schema.js';
export { default as ChecklistTemplateSchema } from './schemas/checklist-template.schema.js';
export * from './matcher.js';
