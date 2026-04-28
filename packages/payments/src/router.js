import { Router } from 'express';

/**
 * @param {{ controller: ReturnType<typeof import('./controller.js').createPaymentsController>, auth: { protect: Function, restrictTo: Function } }} deps
 */
export function createPaymentsAdminRouter({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  // Revenue dashboard — admin only
  router.get('/admin/revenue', protect, restrictTo('admin'), controller.getRevenue);
  router.get('/admin/charges', protect, restrictTo('admin'), controller.listCharges);

  // Payment links — admin + agent
  router
    .route('/admin/payment-links')
    .post(protect, restrictTo('admin', 'agent'), controller.createPaymentLink)
    .get(protect, restrictTo('admin', 'agent'), controller.listPaymentLinks);

  router
    .route('/admin/payment-links/:id')
    .get(protect, restrictTo('admin', 'agent'), controller.getPaymentLink)
    .patch(protect, restrictTo('admin', 'agent'), controller.updatePaymentLink)
    .delete(protect, restrictTo('admin'), controller.deletePaymentLink);

  // Products (catalog of reusable Stripe Prices) — admin + agent
  router
    .route('/admin/products')
    .post(protect, restrictTo('admin', 'agent'), controller.createProduct)
    .get(protect, restrictTo('admin', 'agent'), controller.listProducts);

  router
    .route('/admin/products/:id')
    .get(protect, restrictTo('admin', 'agent'), controller.getProduct)
    .patch(protect, restrictTo('admin', 'agent'), controller.updateProduct)
    .delete(protect, restrictTo('admin'), controller.deleteProduct);

  return router;
}
