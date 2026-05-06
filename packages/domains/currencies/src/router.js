import { Router } from 'express';
import { createCurrencySchema, updateCurrencySchema } from './validators.js';

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

export function createCurrencyRouterFromParts({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router.get('/', controller.getCurrencies);
  router.get('/:code', controller.getCurrencyByCode);
  router.post('/', protect, restrictTo('admin', 'agent'), validate(createCurrencySchema), controller.createCurrency);
  router.put('/:code', protect, restrictTo('admin', 'agent'), validate(updateCurrencySchema), controller.updateCurrency);
  router.delete('/:code', protect, restrictTo('admin', 'agent'), controller.deleteCurrency);

  return router;
}
