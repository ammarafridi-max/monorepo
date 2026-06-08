import { Router } from 'express';

export function createPricingRuleRouterFromParts({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router
    .route('/')
    .get(controller.getAllPricingRules)
    .post(protect, restrictTo('admin', 'agent'), controller.createPricingRule);

  router
    .route('/:id')
    .get(controller.getPricingRule)
    .patch(protect, restrictTo('admin', 'agent'), controller.updatePricingRule)
    .delete(protect, restrictTo('admin'), controller.deletePricingRule);

  router.route('/:id/duplicate').post(protect, restrictTo('admin', 'agent'), controller.duplicatePricingRule);

  return router;
}
