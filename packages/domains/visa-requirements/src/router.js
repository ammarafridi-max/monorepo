import express from 'express';
import rateLimit from 'express-rate-limit';

export function createVisaRequirementsRouterFromParts({ controller, auth }) {
  const router = express.Router();

  // Public checker. Rate limited because it is unauthenticated and each call
  // writes a query-log row; without a cap it is a cheap way to fill the
  // collection with noise and skew the analytics it exists to produce.
  const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  });

  router.get('/check', publicLimiter, controller.check);

  // Admin
  router.use(auth.protect, auth.restrictTo('admin'));
  router.get('/rules', controller.listRules);
  router.post('/rules', controller.upsertRule);
  router.get('/stats', controller.queryStats);
  router.get('/rules/:destination', controller.getRule);
  router.delete('/rules/:destination', controller.deleteRule);

  return router;
}
