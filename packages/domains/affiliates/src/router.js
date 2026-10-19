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

function restrictCommissionToAdmin(req, res, next) {
  if (req.body?.commissionPercent === undefined) return next();
  if (req.user?.role === 'admin') return next();
  next(new AppError('Only an admin can set affiliate commission rates', 403));
}

export function createAffiliateRouter({ controller, payoutController, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router.use(protect, restrictTo('admin', 'agent'));

  // Payout routes must stay above '/:id' so 'payouts' is not read as an affiliate id.
  router
    .route('/payouts')
    .get(payoutController.getPayouts)
    .post(restrictTo('admin'), payoutController.generatePayouts);

  router.get('/payouts/:id', payoutController.getPayoutById);
  router.patch('/payouts/:id/paid', restrictTo('admin'), payoutController.markPayoutPaid);
  router.patch('/payouts/:id/void', restrictTo('admin'), payoutController.voidPayout);

  router
    .route('/')
    .get(controller.getAffiliates)
    .post(restrictCommissionToAdmin, validate(createAffiliateSchema), controller.createAffiliate);

  router.get('/:id/stats', controller.getAffiliateStatsById);
  router.get('/:id/tickets', controller.getAffiliateTicketsById);
  router.get('/:id/applications', controller.getAffiliateApplicationsById);

  router
    .route('/:id')
    .get(controller.getAffiliateById)
    .patch(restrictCommissionToAdmin, validate(updateAffiliateSchema), controller.updateAffiliateById)
    .delete(restrictTo('admin'), controller.deleteAffiliateById);

  return router;
}
