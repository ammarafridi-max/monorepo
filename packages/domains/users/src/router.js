import { Router } from 'express';

export function createUserRouterFromParts({ controller, middleware }) {
  const router = Router();
  const { protect } = middleware;

  router.post('/register', controller.register);
  router.post('/login', controller.login);
  router.post('/logout', controller.logout);
  router.get('/verify-email/:token', controller.verifyEmail);
  router.post('/forgot-password', controller.forgotPassword);
  router.patch('/reset-password/:token', controller.resetPassword);

  router.use(protect);
  router.get('/me', controller.getProfile);
  router.patch('/me', controller.updateProfile);
  router.patch('/me/password', controller.updatePassword);
  router.delete('/me', controller.deleteAccount);

  return router;
}
