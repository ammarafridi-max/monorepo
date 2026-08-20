import { Router } from 'express';
import multer from 'multer';

// WhatsApp caps documents at 100MB, but 16MB covers tickets and passport scans without holding big buffers in memory.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 16 * 1024 * 1024 } });

export function createConversationRouter({ controller, auth }) {
  const { protect, restrictTo } = auth;
  const router = Router();

  router.use(protect, restrictTo('admin', 'agent'));

  router.get('/saved-replies', controller.listSavedReplies);
  router.post('/saved-replies', controller.createSavedReply);
  router.patch('/saved-replies/:id', controller.updateSavedReply);
  router.delete('/saved-replies/:id', controller.deleteSavedReply);

  router.get('/agents', controller.listAssignableAgents);
  router.get('/media/:messageId', controller.getMedia);

  router.get('/', controller.listConversations);
  router.get('/:waId', controller.getThread);
  router.patch('/:waId/read', controller.markRead);
  router.post('/:waId/claim', controller.claimConversation);
  router.patch('/:waId/assign', controller.assignConversation);
  router.post('/:waId/messages', controller.sendMessage);
  router.post('/:waId/messages/media', upload.single('file'), controller.sendMediaMessage);

  return router;
}
