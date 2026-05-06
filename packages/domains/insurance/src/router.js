import { Router } from 'express';

/**
 * Creates and returns the insurance Express router.
 * @param {{ controller, auth: { protect, restrictTo } }} deps
 */
export function createInsuranceRouterFromController({ controller, auth }) {
  const { protect, restrictTo } = auth;
  const router = Router();

  router.route('/').get(protect, restrictTo('admin', 'agent'), controller.getAllApplications);
  router.route('/summary').get(protect, restrictTo('admin', 'agent'), controller.getApplicationsSummary);
  router.route('/create').post(controller.createInsuranceApplication);
  router.route('/quote').post(controller.getInsuranceQuotes);
  router.route('/finalize').post(controller.finalizeInsurance);
  router.route('/nationalities').post(protect, restrictTo('admin'), controller.createNationalities);
  router.route('/nationalities').get(controller.getNationalities);
  router.route('/download/:policyId/:index').get(controller.downloadInsurancePolicy);
  router.route('/documents/:policyId').get(controller.getInsuranceDocuments);
  router.route('/confirm-payment/:sessionId').post(controller.confirmInsurancePayment);
  router
    .route('/:sessionId')
    .get(protect, restrictTo('admin', 'agent'), controller.getInsuranceApplication)
    .patch(protect, restrictTo('admin', 'agent'), controller.updateInsuranceApplication)
    .delete(protect, restrictTo('admin'), controller.deleteInsuranceApplication);

  return router;
}
