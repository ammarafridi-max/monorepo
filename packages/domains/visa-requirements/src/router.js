import express from 'express';
import rateLimit from 'express-rate-limit';

export function createVisaRequirementsRouterFromParts({ controller, auth }) {
  const router = express.Router();

  const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  });

  router.get('/check', publicLimiter, controller.check);
  router.get('/destinations', publicLimiter, controller.listDestinations);

  router.use(auth.protect, auth.restrictTo('admin'));
  router.get('/rules', controller.listRules);
  router.post('/rules', controller.upsertRule);
  router.get('/stats', controller.queryStats);
  router.get('/rules/:destination', controller.getRule);
  router.delete('/rules/:destination', controller.deleteRule);

  return router;
}
