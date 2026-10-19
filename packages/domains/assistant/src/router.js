import { Router } from 'express';
import { AppError } from '@travel-suite/utils';

function createPerUserLimiter({ windowMs, max }) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();

    if (hits.size > 5_000) {
      for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
    }

    const key = String(req.user._id);
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      return next(new AppError('You have reached the assistant message limit for this hour.', 429));
    }
    next();
  };
}

export function createAssistantRouterFromParts({ controller, auth, roles, messagesPerHour }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router.use(protect, restrictTo(...roles));

  router.get('/meta', controller.getMeta);
  router.get('/audit', restrictTo('admin'), controller.getToolCalls);
  router.get('/usage', restrictTo('admin'), controller.getUsage);

  router.get('/conversations', controller.getConversations);
  router.get('/conversations/:id', controller.getConversationById);
  router.delete('/conversations/:id', controller.deleteConversationById);

  router.post(
    '/messages',
    createPerUserLimiter({ windowMs: 60 * 60 * 1000, max: messagesPerHour }),
    controller.postMessage,
  );

  return router;
}
