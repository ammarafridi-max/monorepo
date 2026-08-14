import { Router } from 'express';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

export function createVisaRouterFromParts({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router.get('/', controller.getPublicVisas);
  router.get('/slug/:slug', controller.getPublicVisaBySlug);
  router.get('/residence/:residence', controller.getPublicVisasForResidence);

  router.use(protect, restrictTo('admin'));

  router.get('/admin/list', controller.getAdminVisas);

  // Must stay above /:id — Express matches in order and '/:id' would swallow '/overlays/all'.
  router.get('/overlays/all', controller.listOverlays);
  router.post('/overlays', controller.upsertOverlay);
  router.get('/overlays/:residence/:visaSlug', controller.getOverlay);
  router.delete('/overlays/:residence/:visaSlug', controller.deleteOverlay);

  router.post('/', upload.single('heroImage'), controller.createVisa);
  router.get('/:id', controller.getVisaById);
  router.patch('/:id', upload.single('newHeroImage'), controller.updateVisa);
  router.delete('/:id', controller.deleteVisa);
  router.patch('/:id/publish', controller.publishVisa);
  router.patch('/:id/unpublish', controller.unpublishVisa);
  router.post('/:id/duplicate', controller.duplicateVisa);

  return router;
}
