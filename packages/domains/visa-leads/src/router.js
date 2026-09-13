import { Router } from 'express';

const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 10 * 60 * 1000);

function leadRateLimiter(req, res, next) {
  // Honeypot hits never reach the DB, so they must not burn the allowance of
  // real people behind the same office or carrier IP.
  if (req.body?.website) return next();
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.ip ||
    'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({
      status: 'error',
      message: 'We have had a lot of requests from your network in the last hour. Message us on WhatsApp instead and we will pick it up from there.',
    });
  }
  next();
}

export function createVisaLeadRouterFromParts({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router.post('/', leadRateLimiter, controller.submitLead);

  router.use(protect, restrictTo('admin'));

  router.get('/admin/list',    controller.getAdminLeads);
  router.get('/:id',           controller.getLeadById);
  router.patch('/:id/status',  controller.updateStatus);
  router.patch('/:id/assign',  controller.assignLead);
  router.post('/:id/notes',    controller.addNote);
  router.delete('/:id',        controller.deleteLead);

  return router;
}
