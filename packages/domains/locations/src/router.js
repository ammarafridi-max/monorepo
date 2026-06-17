import { Router } from 'express';

export function createLocationRouter({ controller }) {
  const router = Router();

  router.get('/',              controller.getAutocomplete);
  router.get('/cities',        controller.getCities);
  router.get('/coordinates',   controller.getCoordinates);
  router.get('/distance',      controller.getDistance);
  router.get('/user-location', controller.getUserLocation);

  return router;
}
