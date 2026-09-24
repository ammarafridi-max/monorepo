import { Router } from 'express';
import { catchAsync } from '@travel-suite/utils';

export function createPricingRouter({ service, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router.get('/dummy-ticket', catchAsync(async (req, res) => {
    const data = await service.getPricingPublic(req.query.currency);
    res.json({ status: 'success', data });
  }));

  router.get('/dummy-ticket/admin', protect, restrictTo('admin'), catchAsync(async (req, res) => {
    const data = await service.getPricingAdmin(req.query.currency);
    res.json({ status: 'success', data });
  }));

  router.get('/dummy-ticket/admin/books', protect, restrictTo('admin'), catchAsync(async (req, res) => {
    const data = await service.listPriceBooks();
    res.json({ status: 'success', data });
  }));

  router.patch('/dummy-ticket/admin', protect, restrictTo('admin'), catchAsync(async (req, res) => {
    const data = await service.updatePricing({
      currency: req.body.currency,
      options: req.body.options,
      updatedBy: req.user?._id,
    });
    res.json({ status: 'success', data });
  }));

  router.delete('/dummy-ticket/admin', protect, restrictTo('admin'), catchAsync(async (req, res) => {
    const data = await service.deletePriceBook(req.query.currency);
    res.json({ status: 'success', data });
  }));

  return router;
}
