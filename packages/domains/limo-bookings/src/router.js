import { Router } from 'express';
import { createBookingSchema } from './validators.js';

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

  // Staff only: booking refs are short and sequential, so an open endpoint could be walked to harvest customer data.
  router.route('/reference/:ref').get(protect, restrictTo('admin', 'agent'), controller.getBookingByReference);

  router
    .route('/:id')
    .get(identify, controller.getBookingById)
    .patch(protect, restrictTo('admin', 'agent'), controller.updateBooking)
    .delete(protect, restrictTo('admin'), controller.deleteBooking);

  router.route('/:id/payment-link').post(controller.getPaymentLink);

  router.post('/:transactionId/refund', protect, restrictTo('admin'), controller.refundStripePayment);

  return router;
}
