import { Router } from 'express';

export function createBookingRouter({ controller }) {
  const router = Router();

  router.post('/',                            controller.create);
  router.post('/checkout',                    controller.checkout);
  router.get('/by-session/:sessionId',        controller.getBySessionId);
  router.get('/:id',                          controller.getById);

  return router;
}
