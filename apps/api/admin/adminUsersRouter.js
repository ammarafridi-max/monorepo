import { Router } from 'express';
import { AdminUser } from '@picturesk/shared';
import { AppError, catchAsync, adminErrorHandler } from './errors.js';
import { createAdminUsersService } from './adminUsersService.js';
import { createAdminUserSchema, updateAdminUserSchema, setPasswordSchema } from './adminUsersValidators.js';

/** Turn a validator function into middleware that normalizes/replaces req.body. */
function validate(schema) {
  return (req, _res, next) => {
    try {
      req.body = schema(req.body);
      next();
    } catch (err) {
      next(err instanceof AppError ? err : new AppError(err.message || 'Invalid request data', 400));
    }
  };
}

/** Never return the password hash, even though it is select:false on reads. */
function sanitize(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  return obj;
}

/**
 * Admin-user management router, mounted at /admin-users. ADMIN-ONLY: the injected
 * guard authenticates (cookie session OR ADMIN_TOKEN) and restrictTo('admin')
 * authorizes, so support-role staff and unauthenticated callers get 401/403. This
 * guard is what stops POST / (which accepts `role`) from being a privilege-
 * escalation endpoint.
 *
 *   GET    /admin-users                 list (?role, ?status, ?search)
 *   POST   /admin-users                 create
 *   GET    /admin-users/:username        one
 *   PATCH  /admin-users/:username        update name/email/role/status
 *   DELETE /admin-users/:username        delete
 *   PATCH  /admin-users/:username/password  reset that user's password
 *
 * @param {{ guard: Function, restrictTo: (...roles: string[]) => Function }} deps
 */
export function createAdminUsersRouter({ guard, restrictTo }) {
  const service = createAdminUsersService({ AdminUser });
  const router = Router();

  router.use(guard, restrictTo('admin'));

  router
    .route('/')
    .get(
      catchAsync(async (req, res) => {
        const users = await service.list(req.query);
        res.json({ status: 'success', results: users.length, data: users.map(sanitize) });
      })
    )
    .post(
      validate(createAdminUserSchema),
      catchAsync(async (req, res) => {
        const user = await service.create(req.body);
        res.status(201).json({ status: 'success', message: 'Admin user created', data: sanitize(user) });
      })
    );

  router
    .route('/:username')
    .get(
      catchAsync(async (req, res) => {
        const user = await service.getByUsername(req.params.username);
        res.json({ status: 'success', data: sanitize(user) });
      })
    )
    .patch(
      validate(updateAdminUserSchema),
      catchAsync(async (req, res) => {
        const user = await service.update(req.params.username, req.body, req.user);
        res.json({ status: 'success', message: 'Admin user updated', data: sanitize(user) });
      })
    )
    .delete(
      catchAsync(async (req, res) => {
        await service.remove(req.params.username, req.user);
        res.status(204).json({ status: 'success', data: null });
      })
    );

  router.patch(
    '/:username/password',
    validate(setPasswordSchema),
    catchAsync(async (req, res) => {
      await service.setPassword(req.params.username, req.body, req.user);
      res.json({ status: 'success', message: 'Password updated' });
    })
  );

  router.use(adminErrorHandler);
  return router;
}
