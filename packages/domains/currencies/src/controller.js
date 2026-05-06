import { catchAsync } from '@travel-suite/utils';

export function createCurrencyController({ service }) {
  const getCurrencies = catchAsync(async (req, res) => {
    const data = await service.getCurrencies(req.query);
    res.json({ status: 'success', data });
  });

  const getCurrencyByCode = catchAsync(async (req, res) => {
    const data = await service.getCurrencyByCode(req.params.code);
    res.json({ status: 'success', data });
  });

  const createCurrency = catchAsync(async (req, res) => {
    const data = await service.createCurrency(req.body);
    res.status(201).json({ status: 'success', message: 'Currency created successfully', data });
  });

  const updateCurrency = catchAsync(async (req, res) => {
    const data = await service.updateCurrency(req.params.code, req.body);
    res.json({ status: 'success', message: 'Currency updated successfully', data });
  });

  const deleteCurrency = catchAsync(async (req, res) => {
    await service.deleteCurrency(req.params.code);
    res.json({ status: 'success', message: 'Currency deleted successfully' });
  });

  return { getCurrencies, getCurrencyByCode, createCurrency, updateCurrency, deleteCurrency };
}
