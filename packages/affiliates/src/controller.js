import { catchAsync } from '@travel-suite/utils';

export function createAffiliateController({ service }) {
  const getAffiliates = catchAsync(async (req, res) => {
    const { affiliates, pagination } = await service.getAffiliates(req.query);
    res.json({ status: 'success', data: { affiliates, pagination } });
  });

  const getAffiliateById = catchAsync(async (req, res) => {
    const affiliate = await service.getAffiliateById(req.params.id);
    res.json({ status: 'success', data: affiliate });
  });

  const createAffiliate = catchAsync(async (req, res) => {
    const affiliate = await service.createAffiliate(req.body);
    res.status(201).json({ status: 'success', message: 'Affiliate created successfully', data: affiliate });
  });

  const updateAffiliateById = catchAsync(async (req, res) => {
    const affiliate = await service.updateAffiliateById(req.params.id, req.body);
    res.json({ status: 'success', message: 'Affiliate updated successfully', data: affiliate });
  });

  const deleteAffiliateById = catchAsync(async (req, res) => {
    await service.deleteAffiliateById(req.params.id);
    res.status(204).send();
  });

  const getAffiliateStatsById = catchAsync(async (req, res) => {
    const stats = await service.getAffiliateStatsById(req.params.id, req.query);
    res.json({ status: 'success', data: stats });
  });

  const getAffiliateTicketsById = catchAsync(async (req, res) => {
    const { tickets, pagination } = await service.getAffiliateTicketsById(req.params.id, req.query);
    res.json({ status: 'success', data: { tickets, pagination } });
  });

  const seedAffiliates = catchAsync(async (req, res) => {
    const affiliates = await service.seedAffiliates();
    res.status(201).json({ status: 'success', message: 'Affiliate test data seeded successfully', data: affiliates });
  });

  return { getAffiliates, getAffiliateById, createAffiliate, updateAffiliateById, deleteAffiliateById, getAffiliateStatsById, getAffiliateTicketsById, seedAffiliates };
}
