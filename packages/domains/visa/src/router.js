import { Router } from 'express';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

export function createVisaRouterFromParts({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  // ─── Public routes ───────────────────────────────────────────────────────────
  router.get('/', controller.getPublicVisas);
  router.get('/slug/:slug', controller.getPublicVisaBySlug);

  // ─── Admin routes (require auth) ─────────────────────────────────────────────
  router.use(protect, restrictTo('admin'));

  router.get('/admin/list', controller.getAdminVisas);
  router.post('/', upload.single('heroImage'), controller.createVisa);
  router.get('/:id', controller.getVisaById);
  router.patch('/:id', upload.single('newHeroImage'), controller.updateVisa);
  router.delete('/:id', controller.deleteVisa);
  router.patch('/:id/publish', controller.publishVisa);
  router.patch('/:id/unpublish', controller.unpublishVisa);
  router.post('/:id/duplicate', controller.duplicateVisa);

  return router;
}
