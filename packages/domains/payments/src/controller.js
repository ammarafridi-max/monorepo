import { catchAsync, AppError } from '@travel-suite/utils';

export function createPaymentsController({ service }) {

  const getRevenue = catchAsync(async (req, res) => {
    const { from, to } = req.query;
    const data = await service.getRevenue({ from, to });
    res.status(200).json({ status: 'success', data });
  });

  const listCharges = catchAsync(async (req, res) => {
    const { from, to, limit, startingAfter } = req.query;
    const data = await service.listCharges({ from, to, limit, startingAfter });
    res.status(200).json({ status: 'success', data });
  });

  const createPaymentLink = catchAsync(async (req, res) => {
    const { items, productId, quantity, amount, currency, description, productName, successUrl } = req.body;

    const hasItems = Array.isArray(items) && items.length > 0;
    const hasAmount = amount !== undefined && amount !== null && amount !== '';
    if (!hasItems && !productId && !hasAmount) {
      throw new AppError('Either items, productId, or amount is required', 400);
    }

    const link = await service.createPaymentLink({
      items,
      productId,
      quantity,
      amount,
      currency,
      description,
      productName,
      successUrl,
      createdBy: req.user
        ? { _id: req.user._id, name: req.user.name, email: req.user.email }
        : undefined,
    });

    res.status(201).json({ status: 'success', data: link });
  });

  const listPaymentLinks = catchAsync(async (req, res) => {
    const { status, page, limit } = req.query;
    const data = await service.listPaymentLinks({ status, page, limit });
    res.status(200).json({ status: 'success', data });
  });

  const getPaymentLink = catchAsync(async (req, res) => {
    const data = await service.getPaymentLink({ id: req.params.id });
    res.status(200).json({ status: 'success', data });
  });

  const updatePaymentLink = catchAsync(async (req, res) => {
    const { active, description } = req.body;
    const data = await service.updatePaymentLink({
      id: req.params.id,
      active,
      description,
    });
    res.status(200).json({ status: 'success', data });
  });

  const createProduct = catchAsync(async (req, res) => {
    const { name, unitAmount, currency, description } = req.body;

    if (!name || String(name).trim() === '') {
      throw new AppError('Product name is required', 400);
    }
    if (unitAmount === undefined || unitAmount === null || unitAmount === '') {
      throw new AppError('Unit amount is required', 400);
    }

    const product = await service.createProduct({
      name,
      unitAmount,
      currency,
      description,
      createdBy: req.user
        ? { _id: req.user._id, name: req.user.name, email: req.user.email }
        : undefined,
    });

    res.status(201).json({ status: 'success', data: product });
  });

  const listProducts = catchAsync(async (req, res) => {
    const { activeOnly, page, limit } = req.query;
    const data = await service.listProducts({
      activeOnly: activeOnly === 'true' || activeOnly === '1',
      page,
      limit,
    });
    res.status(200).json({ status: 'success', data });
  });

  const getProduct = catchAsync(async (req, res) => {
    const data = await service.getProduct({ id: req.params.id });
    res.status(200).json({ status: 'success', data });
  });

  const updateProduct = catchAsync(async (req, res) => {
    const { active, name, description, unitAmount, currency } = req.body;

    if (typeof active === 'boolean') {
      const data = await service.setProductActive({ id: req.params.id, active });
      return res.status(200).json({ status: 'success', data });
    }

    const data = await service.updateProduct({
      id: req.params.id,
      name,
      description,
      unitAmount,
      currency,
    });
    res.status(200).json({ status: 'success', data });
  });

  const deleteProduct = catchAsync(async (req, res) => {
    await service.deleteProduct({ id: req.params.id });
    res.status(204).end();
  });

  const deletePaymentLink = catchAsync(async (req, res) => {
    await service.deletePaymentLink({ id: req.params.id });
    res.status(204).end();
  });

  return {
    getRevenue,
    listCharges,
    createPaymentLink,
    listPaymentLinks,
    getPaymentLink,
    updatePaymentLink,
    createProduct,
    listProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    deletePaymentLink,
  };
}
