import { catchAsync } from '@travel-suite/utils';

export function createPricingRuleController({ service }) {
  const getAllPricingRules = catchAsync(async (req, res) => {
    const rules = await service.getAllPricingRules(req.query);
    res.status(200).json({ status: 'success', results: rules.length, data: rules });
  });

  const getPricingRule = catchAsync(async (req, res) => {
    const rule = await service.getPricingRule(req.params.id);
    res.status(200).json({ status: 'success', data: rule });
  });

  const createPricingRule = catchAsync(async (req, res) => {
    const rule = await service.createPricingRule(req.body);
    res.status(201).json({ status: 'success', message: 'Pricing rule created successfully', data: rule });
  });

  const updatePricingRule = catchAsync(async (req, res) => {
    const rule = await service.updatePricingRule(req.params.id, req.body);
    res.status(200).json({ status: 'success', message: 'Pricing rule updated successfully', data: rule });
  });

  const deletePricingRule = catchAsync(async (req, res) => {
    await service.deletePricingRule(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  });

  const duplicatePricingRule = catchAsync(async (req, res) => {
    const rule = await service.duplicatePricingRule(req.params.id);
    res.status(201).json({ status: 'success', message: 'Pricing rule duplicated successfully', data: rule });
  });

  return {
    getAllPricingRules,
    getPricingRule,
    createPricingRule,
    updatePricingRule,
    deletePricingRule,
    duplicatePricingRule,
  };
}
