import { Router } from 'express';
import { AppError } from '@travel-suite/utils';
import { createAffiliateSchema, updateAffiliateSchema } from './validators.js';

function validate(schemaFn) {
  return (req, res, next) => {
    try {
      req.body = schemaFn(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function createAffiliateRouter({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router.use(protect, restrictTo('admin', 'agent'));

  router.post('/seed', controller.seedAffiliates);

  router
    .route('/')
    .get(controller.getAffiliates)
    .post(validate(createAffiliateSchema), controller.createAffiliate);

  router.get('/:id/stats', controller.getAffiliateStatsById);
  router.get('/:id/tickets', controller.getAffiliateTicketsById);
  router.get('/:id/applications', controller.getAffiliateApplicationsById);

  router
    .route('/:id')
    .get(controller.getAffiliateById)
    .patch(validate(updateAffiliateSchema), controller.updateAffiliateById)
    .delete(controller.deleteAffiliateById);

  return router;
}
