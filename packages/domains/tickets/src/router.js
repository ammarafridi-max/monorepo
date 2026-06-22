import { Router } from 'express';

export function createTicketRouter({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  // Public
  router.post('/', controller.createTicketRequest);
  router.post('/checkout', controller.createStripePaymentUrl);
  router.post('/paypal/checkout', controller.createPayPalOrder);
  router.post('/paypal/capture', controller.capturePayPalOrder);

  // Admin + Agent — must come BEFORE the public /:sessionId route below,
  // otherwise Express matches the literal path as a sessionId.
  router.get('/latest-paid', protect, restrictTo('admin', 'agent'), controller.getLatestPaidTicket);
  router.get('/events', protect, restrictTo('admin', 'agent'), controller.streamEvents);

  router.get('/:sessionId', controller.getTicketBySessionId);

  // Admin + Agent
  router.get('/', protect, restrictTo('admin', 'agent'), controller.getAllTickets);
  router.patch('/:sessionId/order-status', protect, restrictTo('admin', 'agent'), controller.updateOrderStatus);

  // Admin only
  router.delete('/:sessionId', protect, restrictTo('admin'), controller.deleteTicket);
  router.post('/refund/:transactionId', protect, restrictTo('admin'), controller.refundByTransactionId);

  return router;
}
