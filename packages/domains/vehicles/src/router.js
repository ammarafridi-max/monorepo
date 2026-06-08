import { Router } from 'express';
import multer from 'multer';

function createUploadMiddleware() {
  const storage = multer.memoryStorage();
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'), false);
  };
  const upload = multer({ storage, fileFilter });
  return upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'images', maxCount: 10 },
  ]);
}

export function createVehicleRouterFromParts({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;
  const uploadVehicleImages = createUploadMiddleware();

  router
    .route('/')
    .get(controller.getAllVehicles)
    .post(protect, restrictTo('admin'), uploadVehicleImages, controller.createVehicle);

  router
    .route('/:id')
    .get(controller.getVehicle)
    .patch(protect, restrictTo('admin'), uploadVehicleImages, controller.updateVehicle)
    .delete(protect, restrictTo('admin'), controller.deleteVehicle);

  router.route('/:id/duplicate').post(protect, restrictTo('admin'), controller.duplicateVehicle);
  router.route('/:id/images').delete(protect, restrictTo('admin'), controller.deleteImage);

  return router;
}
