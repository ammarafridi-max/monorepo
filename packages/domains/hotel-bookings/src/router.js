import { Router } from 'express';

export function createHotelBookingRouter({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router.post('/search', controller.searchOffers);
  router.post('/', controller.createReservationRequest);
  router.post('/checkout', controller.createStripePaymentUrl);
  router.get('/pricing', controller.getPricingPublic);
  router.get('/cities', controller.suggestCities);
  router.get('/countries', controller.listCountries);

  // Must stay above the public /:sessionId route or Express matches these literal paths as a sessionId.
  router.get('/latest-paid', protect, restrictTo('admin', 'agent'), controller.getLatestPaidReservation);
  router.get('/events', protect, restrictTo('admin', 'agent'), controller.streamEvents);

  router.get('/:sessionId', controller.getReservationBySessionId);

  router.get('/', protect, restrictTo('admin', 'agent'), controller.getAllReservations);
  router.patch('/:sessionId/order-status', protect, restrictTo('admin', 'agent'), controller.updateOrderStatus);
  router.post('/:sessionId/retry-booking', protect, restrictTo('admin'), controller.retryBooking);
  router.post('/:sessionId/cancel', protect, restrictTo('admin', 'agent'), controller.cancelReservation);
  router.delete('/:sessionId', protect, restrictTo('admin'), controller.deleteReservation);

  return router;
}

export function createHotelPricingRouter({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router.get('/', protect, restrictTo('admin'), controller.listPriceBooks);
  router.patch('/', protect, restrictTo('admin'), controller.updatePricing);
  router.delete('/:currency', protect, restrictTo('admin'), controller.deletePriceBook);

  return router;
}
