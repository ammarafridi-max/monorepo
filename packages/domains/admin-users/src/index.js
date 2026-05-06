import { createAdminUsersService } from './service.js';
import { createAdminUsersController } from './controller.js';
import { createAdminUsersRouterFromParts } from './router.js';

/**
 * @param {{ AdminUser: import('mongoose').Model, auth: { protect: Function, restrictTo: Function } }} deps
 * @returns {import('express').Router}
 */
export function createAdminUsersRouter({ AdminUser, auth }) {
  const service = createAdminUsersService({ AdminUser });
  const controller = createAdminUsersController({ service });
  return createAdminUsersRouterFromParts({ controller, auth });
}
