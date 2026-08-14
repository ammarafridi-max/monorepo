import { Router } from 'express';
import { availabilityRuleSchema } from './validators.js';

function validate(schema) {
  return (req, res, next) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (err) {
      const message = (err.issues || err.errors)?.[0]?.message || 'Invalid request data';
      return res.status(400).json({ status: 'fail', message });
    }
  };
}

export function createAvailabilityRuleRouterFromParts({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router
    .route('/')
    .get(controller.getAllAvailabilityRules)
    .post(protect, restrictTo('admin'), validate(availabilityRuleSchema), controller.createAvailabilityRule);

  router
    .route('/:id')
    .get(controller.getAvailabilityRule)
    .patch(protect, restrictTo('admin'), validate(availabilityRuleSchema), controller.updateAvailabilityRule)
    .delete(protect, restrictTo('admin'), controller.deleteAvailabilityRule);

  router.route('/:id/duplicate').post(protect, restrictTo('admin'), controller.duplicateAvailabilityRule);

  return router;
}
