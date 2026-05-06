import { Router } from 'express';

export function createFlightRouterFromParts({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router.post('/', controller.fetchFlightsList);
  router.post('/airlines/:airlineCode', protect, restrictTo('admin'), controller.addAirlineInfoByCode);

  return router;
}

export function createAirportRouterFromParts({ controller }) {
  const router = Router();
  router.get('/', controller.fetchAirports);
  return router;
}
