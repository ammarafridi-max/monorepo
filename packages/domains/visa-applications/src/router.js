import { Router } from 'express';
import multer from 'multer';
import { AppError } from '@travel-suite/utils';

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    cb(new AppError('Only PDF, JPEG, and PNG files are allowed.', 400));
  },
});

// Wrap multer so its errors (oversized file, wrong type) become clean 400s.
function uploadSingleDocument(req, res, next) {
  upload.single('document')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof AppError) return next(err);
    if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError('File too large. Maximum size is 15MB.', 400));
    return next(new AppError(err.message || 'File upload failed', 400));
  });
}

/**
 * @param {{ controller, auth: { protect, restrictTo }, userAuth: { protect } }} deps
 * `auth` is the ADMIN middleware; `userAuth` is the customer (userJwt) middleware.
 */
export function createVisaApplicationRouterFromParts({ controller, auth, userAuth }) {
  const router = Router();
  const { protect: adminProtect, restrictTo } = auth;
  const { protect: userProtect } = userAuth;
  const adminOnly = [adminProtect, restrictTo('admin', 'agent')];
  const adminSuper = [adminProtect, restrictTo('admin')];

  // ---- ADMIN — registry CRUD (registered FIRST so their paths aren't shadowed
  //      by /admin/:id). Admin-only. ----
  router.get('/admin/document-types', ...adminOnly, controller.listDocumentTypes);
  router.post('/admin/document-types', ...adminSuper, controller.createDocumentType);
  router.patch('/admin/document-types/:id', ...adminSuper, controller.updateDocumentType);
  router.get('/admin/templates', ...adminOnly, controller.listTemplates);
  router.post('/admin/templates/preview', ...adminOnly, controller.previewTemplate);
  router.post('/admin/templates', ...adminSuper, controller.upsertTemplate);
  router.get('/admin/templates/:id', ...adminOnly, controller.getTemplate);
  router.patch('/admin/templates/:id', ...adminSuper, controller.updateTemplate);

  // ---- ADMIN — reminders + document-level actions ----
  router.get('/admin/list', ...adminOnly, controller.adminList);
  router.post('/admin/reminders/run', ...adminSuper, controller.adminRunReminders);
  router.post('/admin', ...adminOnly, controller.adminCreate);
  router.patch('/admin/documents/:documentId/review', ...adminOnly, controller.adminReviewDocument);
  router.get('/admin/documents/:documentId/view', ...adminOnly, controller.adminViewDocument);
  router.get('/admin/documents/:documentId/stream', ...adminOnly, controller.adminStreamDocument);
  router.post('/admin/documents/:documentId/upload', ...adminOnly, uploadSingleDocument, controller.adminUploadDocument);
  router.post('/admin/documents/:documentId/mark-in-person', ...adminOnly, controller.adminMarkInPerson);
  router.post('/admin/documents/:documentId/satisfied-by', ...adminOnly, controller.adminLinkSatisfiedBy);
  router.delete('/admin/documents/:documentId', ...adminOnly, controller.adminRemoveDocumentRow);

  // ---- ADMIN — application + applicant ----
  router.get('/admin/:id', ...adminOnly, controller.adminGetById);
  router.patch('/admin/:id', ...adminOnly, controller.adminUpdate);
  router.post('/admin/:id/applicants', ...adminOnly, controller.adminAddApplicant);
  router.patch('/admin/:id/applicants/:applicantId', ...adminOnly, controller.adminUpdateApplicant);
  router.post('/admin/:id/applicants/:applicantId/documents', ...adminOnly, controller.adminAddDocumentRow);
  router.post('/admin/:id/notes', ...adminOnly, controller.adminAddNote);

  // ---- CUSTOMER (userJwt) ----
  router.get('/mine', userProtect, controller.listMine);
  router.get('/documents/:documentId/view', userProtect, controller.viewDocument);
  router.get('/documents/:documentId/stream', userProtect, controller.streamDocument);
  router.get('/:applicationRef', userProtect, controller.getMine);
  router.patch('/:applicationRef', userProtect, controller.updateApplication);
  router.patch('/:applicationRef/applicants/:applicantId', userProtect, controller.updateApplicant);
  router.post('/:applicationRef/applicants/:applicantId/documents', userProtect, uploadSingleDocument, controller.uploadDocument);

  return router;
}
