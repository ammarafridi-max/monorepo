import { catchAsync } from '@travel-suite/utils';

export function createVehicleController({ service }) {
  const getAllVehicles = catchAsync(async (req, res) => {
    const data = await service.getAllVehicles();
    res.status(200).json({ status: 'success', data });
  });

  const getVehicle = catchAsync(async (req, res) => {
    const data = await service.getVehicle(req.params.id);
    res.status(200).json({ status: 'success', data });
  });

  const createVehicle = catchAsync(async (req, res) => {
    const data = await service.createVehicle({ body: req.body, files: req.files });
    res.status(201).json({ status: 'success', message: 'Vehicle created successfully', data });
  });

  const updateVehicle = catchAsync(async (req, res) => {
    const data = await service.updateVehicle(req.params.id, { body: req.body, files: req.files });
    res.status(200).json({ status: 'success', message: 'Vehicle updated successfully', data });
  });

  const deleteVehicle = catchAsync(async (req, res) => {
    await service.deleteVehicle(req.params.id);
    res.status(204).json({ status: 'success', message: 'Vehicle deleted successfully', data: null });
  });

  const duplicateVehicle = catchAsync(async (req, res) => {
    const data = await service.duplicateVehicle(req.params.id);
    res.status(201).json({ status: 'success', message: 'Vehicle duplicated successfully', data });
  });

  const deleteImage = catchAsync(async (req, res) => {
    const data = await service.deleteImage(req.params.id, req.body.imageUrl);
    res.status(200).json({ status: 'success', message: 'Image deleted successfully', data });
  });

  return { getAllVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle, duplicateVehicle, deleteImage };
}
