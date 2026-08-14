import { Router } from 'express';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export function createTicketRouter({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router.post('/', controller.createTicketRequest);
  router.post('/checkout', controller.createStripePaymentUrl);
  router.post('/paypal/checkout', controller.createPayPalOrder);
  router.post('/paypal/capture', controller.capturePayPalOrder);

  // Must stay above the public /:sessionId route or Express matches these literal paths as a sessionId.
  router.get('/latest-paid', protect, restrictTo('admin', 'agent'), controller.getLatestPaidTicket);
  router.get('/events', protect, restrictTo('admin', 'agent'), controller.streamEvents);

  router.get('/:sessionId', controller.getTicketBySessionId);

  router.get('/', protect, restrictTo('admin', 'agent'), controller.getAllTickets);
  router.patch('/:sessionId/order-status', protect, restrictTo('admin', 'agent'), controller.updateOrderStatus);
  router.patch('/:sessionId/delivery', protect, restrictTo('admin', 'agent'), controller.updateDelivery);
  router.post('/:sessionId/send-reservation', protect, restrictTo('admin', 'agent'), upload.single('file'), controller.sendReservation);

  router.delete('/:sessionId', protect, restrictTo('admin'), controller.deleteTicket);
  router.post('/refund/:transactionId', protect, restrictTo('admin'), controller.refundByTransactionId);

  return router;
}
