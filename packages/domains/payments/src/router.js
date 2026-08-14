import { Router } from 'express';

export function createPaymentsAdminRouter({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router.get('/admin/revenue', protect, restrictTo('admin'), controller.getRevenue);
  router.get('/admin/charges', protect, restrictTo('admin'), controller.listCharges);

  router
    .route('/admin/payment-links')
    .post(protect, restrictTo('admin', 'agent'), controller.createPaymentLink)
    .get(protect, restrictTo('admin', 'agent'), controller.listPaymentLinks);

  router
    .route('/admin/payment-links/:id')
    .get(protect, restrictTo('admin', 'agent'), controller.getPaymentLink)
    .patch(protect, restrictTo('admin', 'agent'), controller.updatePaymentLink)
    .delete(protect, restrictTo('admin'), controller.deletePaymentLink);

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
