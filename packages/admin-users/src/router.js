import { Router } from 'express';
import { AppError } from '@travel-suite/utils';
import { createAdminUserSchema, updateAdminUserSchema } from './validators.js';

function validate(schemaFn) {
  return (req, res, next) => {
    try {
      req.body = schemaFn(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function createAdminUsersRouterFromParts({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  // Any authenticated admin (any role) can fetch their own profile
  router.get('/me', protect, controller.getMe);

  router.use(protect, restrictTo('admin'));

  router
    .route('/')
    .get(controller.getAdminUsers)
    .post(validate(createAdminUserSchema), controller.createAdminUser);

  router
    .route('/:username')
    .get(controller.getAdminUser)
    .patch(validate(updateAdminUserSchema), controller.updateAdminUser)
    .delete(controller.deleteAdminUser);

  return router;
}
