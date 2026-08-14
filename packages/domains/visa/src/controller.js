import { catchAsync, AppError } from '@travel-suite/utils';

export function createVisaController({ service }) {

  const getPublicVisas = catchAsync(async (req, res) => {
    const visas = await service.getPublicVisas();
    res.status(200).json({ status: 'success', results: visas.length, data: visas });
  });

  const getPublicVisaBySlug = catchAsync(async (req, res, next) => {
    const visa = await service.getPublicVisaBySlugForResidence(req.params.slug, req.query.residence);
    if (!visa) return next(new AppError('Visa not found', 404));
    res.status(200).json({ status: 'success', data: visa });
  });

  const getPublicVisasForResidence = catchAsync(async (req, res) => {
    const visas = await service.getPublicVisasForResidence(req.params.residence);
    res.status(200).json({ status: 'success', results: visas.length, data: visas });
  });

  const listOverlays = catchAsync(async (req, res) => {
    const filter = {};
    if (req.query.residence) filter.residence = String(req.query.residence).toUpperCase();
    if (req.query.visaSlug) filter.visaSlug = req.query.visaSlug;
    const overlays = await service.listOverlays(filter);
    res.status(200).json({ status: 'success', results: overlays.length, data: overlays });
  });

  const getOverlay = catchAsync(async (req, res, next) => {
    const overlay = await service.getOverlay(req.params.residence, req.params.visaSlug);
    if (!overlay) return next(new AppError('No overlay for that country and visa', 404));
    res.status(200).json({ status: 'success', data: overlay });
  });

  const upsertOverlay = catchAsync(async (req, res) => {
    const overlay = await service.upsertOverlay(req.body);
    res.status(200).json({ status: 'success', data: overlay });
  });

  const deleteOverlay = catchAsync(async (req, res) => {
    await service.deleteOverlay(req.params.residence, req.params.visaSlug);
    res.status(204).send();
  });

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
    getPublicVisasForResidence,
    listOverlays,
    getOverlay,
    upsertOverlay,
    deleteOverlay,
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
