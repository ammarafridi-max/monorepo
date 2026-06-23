import { Router } from 'express';
import multer from 'multer';

// In-memory upload for document parsing — files go straight to the AI, not disk.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 5 } });

/**
 * @param {{ controller: object, generateLimiter?: import('express').RequestHandler }} deps
 *   generateLimiter is an optional per-IP rate limiter applied to the generation
 *   routes (each generation is a paid AI call — the app injects this).
 */
export function createItineraryRouter({ controller, auth, generateLimiter }) {
  const router = Router();
  const limit = generateLimiter || ((_req, _res, next) => next());
  const { protect, restrictTo } = auth;

  // Admin: list all itineraries (paginated/searchable/filterable). Above the
  // generation routes; matches only the bare collection path.
  router.get('/', protect, restrictTo('admin', 'agent'), controller.listOrders);

  // Generation routes — rate-limited per IP (per-session caps live in the service).
  // Create accepts optional supporting documents (multipart) to archive with the
  // order; plain-JSON requests (no files) pass straight through multer.
  router.post('/', limit, upload.array('documents', 5), controller.createOrder);
  router.post('/:sessionId/regenerate', limit, controller.regenerate);
  router.post('/:sessionId/edit', limit, controller.edit);
  router.post('/:sessionId/chat', limit, controller.chat); // conversational AI edit
  router.get('/:sessionId/chat', controller.getChat); // conversation history

  // Parse uploaded documents -> segments + reservations (prefills the form).
  router.post('/parse-documents', limit, upload.array('documents', 5), controller.parseDocuments);

  // Admin: full order detail (incl. Cloudinary document URLs).
  router.get('/:sessionId/detail', protect, restrictTo('admin', 'agent'), controller.getOrderDetail);

  // Admin: delete an itinerary (+ its Cloudinary assets).
  router.delete('/:sessionId', protect, restrictTo('admin'), controller.deleteOrder);

  // Reads + payment.
  router.get('/:sessionId', controller.getOrder);
  router.get('/:sessionId/preview', controller.getPreview); // watermarked image
  router.post('/:sessionId/checkout', controller.createCheckout);
  router.get('/:sessionId/document', controller.getDocument); // clean PDF, paid only

  return router;
}
