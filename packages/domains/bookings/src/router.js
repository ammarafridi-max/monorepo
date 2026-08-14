import { Router } from 'express';

export function createBookingRouter({ controller, auth }) {
  const router = Router();
  const { identify } = auth || {};
  if (typeof identify !== 'function') {
    throw new Error('createBookingRouter requires auth.identify');
  }

  router.post('/',                            controller.create);
  router.post('/checkout',                    controller.checkout);

  // Soft `identify`, not `protect`: the customer reading their own receipt is not logged in.
  router.get('/by-session/:sessionId', identify, controller.getBySessionId);
  router.get('/:id',                   identify, controller.getById);

  return router;
}
