import { Router } from 'express';
import multer from 'multer';

const uploadLogo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

export function createFlightRouterFromParts({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router.post('/', controller.fetchFlightsList);
  router.get('/airlines', protect, restrictTo('admin'), controller.fetchAirlines);
  router.post('/airlines/:airlineCode', protect, restrictTo('admin'), controller.addAirlineInfoByCode);
  router.patch(
    '/airlines/:airlineCode/logo',
    protect,
    restrictTo('admin'),
    uploadLogo.single('logo'),
    controller.updateAirlineLogo,
  );
  router.delete('/airlines/:airlineCode/logo', protect, restrictTo('admin'), controller.deleteAirlineLogo);

  return router;
}

export function createAirportRouterFromParts({ controller }) {
  const router = Router();
  router.get('/', controller.fetchAirports);
  return router;
}
