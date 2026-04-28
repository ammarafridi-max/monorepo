import { catchAsync, AppError } from '@travel-suite/utils';

/**
 * @param {{ service: ReturnType<typeof import('./service.js').createPaymentService>, notifications?: { sendPaymentLinkPaidToAdmin?: Function } }} deps
 */
export function createPaymentsController({ service }) {
  // -- Revenue dashboard (admin only) ---------------------------------------

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

  // -- Payment links (admin + agent) ----------------------------------------

  const createPaymentLink = catchAsync(async (req, res) => {
    const { amount, currency, description, productName, successUrl } = req.body;

    if (amount === undefined || amount === null || amount === '') {
      throw new AppError('Amount is required', 400);
    }

    const link = await service.createPaymentLink({
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

  const setPaymentLinkActive = catchAsync(async (req, res) => {
    const { active } = req.body;
    const data = await service.setPaymentLinkActive({
      id: req.params.id,
      active,
    });
    res.status(200).json({ status: 'success', data });
  });

  return {
    getRevenue,
    listCharges,
    createPaymentLink,
    listPaymentLinks,
    getPaymentLink,
    setPaymentLinkActive,
  };
}
