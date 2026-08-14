import { Router } from 'express';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 5 } });

export function createItineraryRouter({ controller, auth, generateLimiter }) {
  const router = Router();
  const limit = generateLimiter || ((_req, _res, next) => next());
  const { protect, restrictTo } = auth;

  router.get('/', protect, restrictTo('admin', 'agent'), controller.listOrders);

  router.post('/', limit, upload.array('documents', 5), controller.createOrder);
  router.post('/:sessionId/regenerate', limit, controller.regenerate);
  router.post('/:sessionId/edit', limit, controller.edit);
  router.post('/:sessionId/chat', limit, controller.chat);
  router.get('/:sessionId/chat', controller.getChat);

  router.post('/parse-documents', limit, upload.array('documents', 5), controller.parseDocuments);

  router.get('/:sessionId/detail', protect, restrictTo('admin', 'agent'), controller.getOrderDetail);

  router.delete('/:sessionId', protect, restrictTo('admin'), controller.deleteOrder);

  router.get('/:sessionId', controller.getOrder);
  router.get('/:sessionId/preview', controller.getPreview);
  router.post('/:sessionId/checkout', controller.createCheckout);
  router.get('/:sessionId/document', controller.getDocument);

  return router;
}
