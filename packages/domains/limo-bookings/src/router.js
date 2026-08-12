import { Router } from 'express';
import { createBookingSchema } from './validators.js';

// Mirrors source middleware/validate.js: parses into req.validatedBody, responds 400 directly.
function validate(schema) {
  return (req, res, next) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (err) {
      const message = (err.issues || err.errors)?.[0]?.message || 'Invalid request data';
      return res.status(400).json({ status: 'fail', message });
    }
  };
}

export function createBookingRouterFromParts({ controller, auth }) {
  const router = Router();
  const { protect, identify, restrictTo } = auth;

  router
    .route('/')
    .get(protect, restrictTo('admin', 'agent'), controller.getBookings)
    .post(validate(createBookingSchema), controller.createBooking);

  router.route('/available-vehicles').get(controller.getVehicles);

  // Staff only. A booking reference is short and human-readable, so an open
  // endpoint keyed on it can be walked in order to harvest every customer's
  // contact and journey details. Nothing in any frontend calls this.
  router.route('/reference/:ref').get(protect, restrictTo('admin', 'agent'), controller.getBookingByReference);

  router
    .route('/:id')
    // Deliberately reachable without logging in: this is the customer's own
    // payment-confirmation page, reached from the Stripe redirect. `identify`
    // is the soft variant, so staff still get the full record and the public
    // gets a redacted one (see controller.getBookingById).
    .get(identify, controller.getBookingById)
    .patch(protect, restrictTo('admin', 'agent'), controller.updateBooking)
    .delete(protect, restrictTo('admin'), controller.deleteBooking);

  router.route('/:id/payment-link').post(controller.getPaymentLink);

  router.post('/:transactionId/refund', protect, restrictTo('admin'), controller.refundStripePayment);

  return router;
}
