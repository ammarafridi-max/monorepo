import { Router } from 'express';

export function createZoneRouterFromParts({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router.route('/').get(controller.getAllZones).post(protect, restrictTo('admin'), controller.createZone);

  // Must be registered before the '/:id' routes so it is not shadowed.
  router.get('/find/by-point', controller.getZoneByPoint);

  router
    .route('/:id')
    .get(controller.getZone)
    .patch(protect, restrictTo('admin'), controller.updateZone)
    .delete(protect, restrictTo('admin'), controller.deleteZone);

  router.route('/:id/duplicate').post(protect, restrictTo('admin'), controller.duplicateZone);

  return router;
}
