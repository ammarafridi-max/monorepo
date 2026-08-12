import { Router } from 'express';

export function createBookingRouter({ controller, auth }) {
  const router = Router();
  const { identify } = auth || {};
  // Fail at startup rather than serving unredacted records because a
  // composition root forgot to inject the auth middleware.
  if (typeof identify !== 'function') {
    throw new Error('createBookingRouter requires auth.identify');
  }

  router.post('/',                            controller.create);
  router.post('/checkout',                    controller.checkout);

  // Both reads stay reachable without logging in: this is the customer's own
  // receipt after the Stripe redirect, and they have no account. `identify` is
  // the soft variant, so staff still get the full record while everyone else
  // gets the redacted receipt view (see controller.redactForPublic).
  router.get('/by-session/:sessionId', identify, controller.getBySessionId);
  router.get('/:id',                   identify, controller.getById);

  return router;
}
