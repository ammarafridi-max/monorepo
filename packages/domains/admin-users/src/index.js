import { createAdminUsersService } from './service.js';
import { createAdminUsersController } from './controller.js';
import { createAdminUsersRouterFromParts } from './router.js';

export function createAdminUsersRouter({ AdminUser, auth }) {
  const service = createAdminUsersService({ AdminUser });
  const controller = createAdminUsersController({ service });
  return createAdminUsersRouterFromParts({ controller, auth });
}
