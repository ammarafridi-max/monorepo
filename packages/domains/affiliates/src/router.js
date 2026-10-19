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

function createFixedWindowLimiter({ windowMs, max }) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();

    if (hits.size > 10_000) {
      for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
    }

    const key = req.ip || 'unknown';
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) return res.status(204).send();
    next();
  };
}

export function createAffiliateRouter({
  controller,
  payoutController,
  auth,
  clickRateLimit = createFixedWindowLimiter({ windowMs: 60 * 60 * 1000, max: 60 }),
}) {
  const router = Router();
  const { protect, restrictTo } = auth;

  // Deliberately public: this route must stay above the router.use(protect, ...) line below.
  router.post('/clicks/:affiliateId', clickRateLimit, controller.recordAffiliateClick);

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
