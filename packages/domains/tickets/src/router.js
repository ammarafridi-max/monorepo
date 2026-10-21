import { Router } from 'express';
import multer from 'multer';
import { AppError } from '@travel-suite/utils';
import { createFixedWindowLimiter } from '@travel-suite/utils/fixed-window-limiter';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new AppError('The reservation must be a PDF file', 400));
    }
    cb(null, true);
  },
});

const createRequestLimiter = createFixedWindowLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  onLimit: (_req, res) =>
    res.status(429).json({
      status: 'fail',
      message: 'Too many booking attempts from this network. Please try again later or email us.',
    }),
});

export function createTicketRouter({ controller, auth }) {
  const router = Router();
  const { protect, identify, restrictTo } = auth;

  router.post('/', createRequestLimiter, controller.createTicketRequest);
  router.post('/checkout', controller.createStripePaymentUrl);
  router.post('/paypal/checkout', controller.createPayPalOrder);
  router.post('/paypal/capture', controller.capturePayPalOrder);

  // Must stay above the public /:sessionId route or Express matches these literal paths as a sessionId.
  router.get('/latest-paid', protect, restrictTo('admin', 'agent'), controller.getLatestPaidTicket);
  router.get('/stats', protect, restrictTo('admin', 'agent'), controller.getTicketStats);
  router.get('/events', protect, restrictTo('admin', 'agent'), controller.streamEvents);

  router.get('/:sessionId/quote', controller.getTicketQuote);
  router.get('/:sessionId/reservation', protect, restrictTo('admin', 'agent'), controller.getReservationFile);
  router.get('/:sessionId', identify, controller.getTicketBySessionId);

  router.get('/', protect, restrictTo('admin', 'agent'), controller.getAllTickets);
  router.patch('/:sessionId/order-status', protect, restrictTo('admin', 'agent'), controller.updateOrderStatus);
  router.patch('/:sessionId/delivery', protect, restrictTo('admin', 'agent'), controller.updateDelivery);
  router.post('/:sessionId/send-reservation', protect, restrictTo('admin', 'agent'), upload.single('file'), controller.sendReservation);

  router.delete('/:sessionId', protect, restrictTo('admin'), controller.deleteTicket);
  router.post('/refund/:transactionId', protect, restrictTo('admin'), controller.refundByTransactionId);

  return router;
}
