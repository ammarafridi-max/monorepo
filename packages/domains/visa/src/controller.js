import { catchAsync, AppError } from '@travel-suite/utils';

export function createVisaController({ service }) {
  // ─── Public ──────────────────────────────────────────────────────────────────

  const getPublicVisas = catchAsync(async (req, res) => {
    const visas = await service.getPublicVisas();
    res.status(200).json({ status: 'success', results: visas.length, data: visas });
  });

  const getPublicVisaBySlug = catchAsync(async (req, res, next) => {
    const visa = await service.getPublicVisaBySlug(req.params.slug);
    if (!visa) return next(new AppError('Visa not found', 404));
    res.status(200).json({ status: 'success', data: visa });
  });

  // ─── Admin ───────────────────────────────────────────────────────────────────

  const getAdminVisas = catchAsync(async (req, res) => {
    const { page = 1, limit = 20, status, search } = req.query;
    const result = await service.getAdminVisas({ page, limit, status, search });
    res.status(200).json({ status: 'success', results: result.visas.length, data: result });
  });

  const getVisaById = catchAsync(async (req, res, next) => {
    const visa = await service.getVisaById(req.params.id);
    if (!visa) return next(new AppError('Visa not found', 404));
    res.status(200).json({ status: 'success', data: visa });
  });

  const createVisa = catchAsync(async (req, res) => {
    const visa = await service.createVisa({ body: req.body, file: req.file, userId: req.user._id });
    res.status(201).json({ status: 'success', message: 'Visa created successfully', data: visa });
  });

  const updateVisa = catchAsync(async (req, res) => {
    const visa = await service.updateVisa({ id: req.params.id, body: req.body, file: req.file });
    res.status(200).json({ status: 'success', message: 'Visa updated successfully', data: visa });
  });

  const deleteVisa = catchAsync(async (req, res) => {
    await service.deleteVisa(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  });

  const publishVisa = catchAsync(async (req, res) => {
    const visa = await service.publishVisa(req.params.id);
    res.status(200).json({ status: 'success', message: 'Visa published successfully', data: visa });
  });

  const unpublishVisa = catchAsync(async (req, res) => {
    const visa = await service.unpublishVisa(req.params.id);
    res.status(200).json({ status: 'success', message: 'Visa unpublished successfully', data: visa });
  });

  const duplicateVisa = catchAsync(async (req, res) => {
    const visa = await service.duplicateVisa(req.params.id);
    res.status(201).json({ status: 'success', message: 'Visa duplicated successfully', data: visa });
  });

  return {
    getPublicVisas,
    getPublicVisaBySlug,
    getAdminVisas,
    getVisaById,
    createVisa,
    updateVisa,
    deleteVisa,
    publishVisa,
    unpublishVisa,
    duplicateVisa,
  };
}
