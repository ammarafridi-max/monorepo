import { AppError } from '@travel-suite/utils';

export function createZoneService({ Zone }) {
  const getAllZones = async () => Zone.find().sort({ name: 1 });

  const getZone = async (id) => {
    const zone = await Zone.findById(id);
    if (!zone) throw new AppError('Zone not found', 404);
    return zone;
  };

  const createZone = async (payload) => Zone.create(payload);

  const updateZone = async (id, payload) => {
    const zone = await Zone.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!zone) throw new AppError('Zone not found', 404);
    return zone;
  };

  const deleteZone = async (id) => {
    const zone = await Zone.findByIdAndDelete(id);
    if (!zone) throw new AppError('Zone not found', 404);
  };

  const duplicateZone = async (id) => {
    const zone = await Zone.findById(id);
    if (!zone) throw new AppError('Zone not found', 404);

    const zoneObj = zone.toObject();
    delete zoneObj._id;
    delete zoneObj.createdAt;
    delete zoneObj.updatedAt;
    delete zoneObj.__v;

    return Zone.create({ ...zoneObj, name: `${zoneObj.name} Copy` });
  };

  const getZoneByPoint = async ({ lat, lng }) => {
    if (!lat || !lng) throw new AppError('Please provide lat and lng as query params', 400);

    const zone = await Zone.findOne({
      geometry: {
        $geoIntersects: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        },
      },
    });

    if (!zone) throw new AppError('No zone found for this location', 404);
    return zone;
  };

  return { getAllZones, getZone, createZone, updateZone, deleteZone, duplicateZone, getZoneByPoint };
}
