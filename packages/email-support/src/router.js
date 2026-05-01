import { Router } from 'express';

export function createEmailSupportRouter({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router.use(protect, restrictTo('admin', 'agent'));

  router.get('/', controller.getEmails);
  router.patch('/:id/draft', controller.updateDraft);
  router.post('/:id/send', controller.sendReply);
  router.post('/:id/skip', controller.skipEmail);

  return router;
}
