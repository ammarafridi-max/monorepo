import { catchAsync, AppError } from '@travel-suite/utils';

export function createAvailabilityRuleController({ service }) {
  // Deliberate: persists raw req.body, not the zod-parsed body.
  const createAvailabilityRule = catchAsync(async (req, res) => {
    const rule = await service.createRuleRaw(req.body);
    res.status(201).json({ status: 'success', message: 'Availability rule created successfully', data: rule });
  });

  const getAllAvailabilityRules = catchAsync(async (req, res) => {
    const rules = await service.getAllRules();
    res.status(200).json({ status: 'success', results: rules.length, data: rules });
  });

  const getAvailabilityRule = catchAsync(async (req, res, next) => {
    const rule = await service.getRuleById(req.params.id);
    if (!rule) return next(new AppError('Rule not found', 404));
    res.status(200).json({ status: 'success', data: rule });
  });

  const updateAvailabilityRule = catchAsync(async (req, res, next) => {
    const updated = await service.updateRule(req.params.id, req.validatedBody);
    if (!updated) return next(new AppError('No availability rule found with that ID', 404));
    res.status(200).json({ status: 'success', message: 'Availability rule updated successfully', data: updated });
  });

  const deleteAvailabilityRule = catchAsync(async (req, res, next) => {
    const deleted = await service.deleteRule(req.params.id);
    if (!deleted) return next(new AppError('No availability rule found with that ID', 404));
    res.status(204).json({ status: 'success', data: null });
  });

  const duplicateAvailabilityRule = catchAsync(async (req, res, next) => {
    const duplicated = await service.duplicateRule(req.params.id);
    if (!duplicated) return next(new AppError('Availability rule not found', 404));
    res.status(201).json({ status: 'success', message: 'Availability rule duplicated successfully', data: duplicated });
  });

  return {
    createAvailabilityRule,
    getAllAvailabilityRules,
    getAvailabilityRule,
    updateAvailabilityRule,
    deleteAvailabilityRule,
    duplicateAvailabilityRule,
  };
}
