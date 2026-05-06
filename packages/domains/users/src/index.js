import UserSchema from './schemas/user.schema.js';
import { createUserService } from './service.js';
import { createUserMiddleware } from './middleware.js';
import { createUserController } from './controller.js';
import { createUserRouterFromParts } from './router.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createUsersRouter({ db, jwtSecret, jwtExpiresIn = '7d', cookieExpiresInDays = 7, nodeEnv = 'development', notifications } = {}) {
  const User = getOrRegisterModel(db, 'User', UserSchema);
  const service = createUserService({ User, jwtSecret, jwtExpiresIn, notifications });
  const middleware = createUserMiddleware({ User, jwtSecret });
  const controller = createUserController({ service, cookieExpiresInDays, nodeEnv });
  const router = createUserRouterFromParts({ controller, middleware });

  return { router, middleware };
}
