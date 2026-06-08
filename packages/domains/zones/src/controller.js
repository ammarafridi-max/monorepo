import { catchAsync } from '@travel-suite/utils';

export function createZoneController({ service }) {
  const getAllZones = catchAsync(async (req, res) => {
    const zones = await service.getAllZones();
    res.status(200).json({ status: 'success', results: zones.length, data: zones });
  });

  const getZone = catchAsync(async (req, res) => {
    const zone = await service.getZone(req.params.id);
    res.status(200).json({ status: 'success', data: { zone } });
  });

  const createZone = catchAsync(async (req, res) => {
    const zone = await service.createZone(req.body);
    res.status(201).json({ status: 'success', message: 'Zone created successfully', data: { zone } });
  });

  const updateZone = catchAsync(async (req, res) => {
    const zone = await service.updateZone(req.params.id, req.body);
    res.status(200).json({ status: 'success', message: 'Zone updated successfully', data: { zone } });
  });

  const deleteZone = catchAsync(async (req, res) => {
    await service.deleteZone(req.params.id);
    res.status(204).json({ status: 'success', message: 'Zone deleted successfully', data: null });
  });

  const duplicateZone = catchAsync(async (req, res) => {
    const zone = await service.duplicateZone(req.params.id);
    res.status(201).json({ status: 'success', message: 'Zone duplicated successfully', data: { zone } });
  });

  const getZoneByPoint = catchAsync(async (req, res) => {
    const zone = await service.getZoneByPoint(req.query);
    res.status(200).json({ status: 'success', data: zone });
  });

  return { getAllZones, getZone, createZone, updateZone, deleteZone, duplicateZone, getZoneByPoint };
}
