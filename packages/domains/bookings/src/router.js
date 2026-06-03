import { Router } from 'express';

export function createBookingRouter({ controller }) {
  const router = Router();

  router.post('/',        controller.create);
  router.get('/:id',     controller.getById);

  return router;
}
