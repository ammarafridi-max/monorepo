import { AppError } from '@travel-suite/utils';

// Cloudinary sub-folder for a vehicle's images, e.g. "vehicles/Mercedes_S_Class".
function vehicleFolder(brand, model) {
  return `vehicles/${brand}_${model}`.replace(/\s+/g, '_');
}

function parsePricing(pricing) {
  if (pricing == null) return undefined;
  if (typeof pricing === 'object') return pricing;
  if (typeof pricing === 'string') {
    try {
      return JSON.parse(pricing);
    } catch {
      throw new AppError('Invalid pricing format', 400);
    }
  }
  return undefined;
}

/**
 * @param images Image-store adapter (DI):
 *   uploadImage(buffer, folder) -> Promise<secureUrl>
 *   deleteImage(url)            -> Promise<boolean>
 *   deleteFolder(folder)        -> Promise<boolean>
 */
export function createVehicleService({ Vehicle, images }) {
  const getAllVehicles = async () => {
    const vehicles = await Vehicle.find().select('-__v').sort({ brand: 1 });
    if (!vehicles || vehicles.length === 0) throw new AppError('No vehicles found', 404);
    return vehicles;
  };

  const getVehicle = async (id) => {
    const vehicle = await Vehicle.findById(id).select('-__v');
    if (!vehicle) throw new AppError('Vehicle not found', 404);
    return vehicle;
  };

  const createVehicle = async ({ body, files }) => {
    if (!files?.featuredImage?.[0]) throw new AppError('Featured image is required', 400);

    const folder = vehicleFolder(body.brand, body.model);
    const pricing = parsePricing(body.pricing);

    try {
      const featuredImage = await images.uploadImage(files.featuredImage[0].buffer, folder);

      const uploadedImages = [];
      if (files?.images?.length > 0) {
        for (const img of files.images) {
          uploadedImages.push(await images.uploadImage(img.buffer, folder));
        }
      }

      return await Vehicle.create({
        brand: body.brand,
        model: body.model,
        year: body.year,
        description: body.description,
        passengers: body.passengers,
        luggage: body.luggage,
        type: body.type,
        class: body.class,
        fuel: body.fuel,
        featuredImage,
        images: uploadedImages,
        pricing,
      });
    } catch (err) {
      // Roll back any uploaded assets so we don't orphan files in Cloudinary.
      await images.deleteFolder(folder);
      if (err instanceof AppError) throw err;
      throw new AppError('Failed to create vehicle. Uploads rolled back.', 500);
    }
  };

  const updateVehicle = async (id, { body, files }) => {
    const pricing = parsePricing(body.pricing);

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) throw new AppError('Vehicle not found', 404);

    const folder = vehicleFolder(vehicle.brand, vehicle.model);
    let featuredImageUrl = vehicle.featuredImage;
    let imagesUrls = vehicle.images;

    try {
      if (files?.featuredImage?.[0]) {
        await images.deleteImage(vehicle.featuredImage);
        featuredImageUrl = await images.uploadImage(files.featuredImage[0].buffer, folder);
      }

      if (files?.images?.length > 0) {
        const uploads = await Promise.all(files.images.map((img) => images.uploadImage(img.buffer, folder)));
        imagesUrls = [...imagesUrls, ...uploads];
      }

      const updateData = {
        brand: body.brand ?? vehicle.brand,
        model: body.model ?? vehicle.model,
        year: body.year ?? vehicle.year,
        description: body.description ?? vehicle.description,
        passengers: body.passengers ?? vehicle.passengers,
        luggage: body.luggage ?? vehicle.luggage,
        type: body.type ?? vehicle.type,
        fuel: body.fuel ?? vehicle.fuel,
        class: body.class ?? vehicle.class,
        featuredImage: featuredImageUrl,
        images: imagesUrls,
        pricing: pricing ?? vehicle.pricing,
      };

      return await Vehicle.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Failed to update vehicle.', 500);
    }
  };

  const deleteVehicle = async (id) => {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) throw new AppError('Vehicle not found', 404);

    const folder = vehicleFolder(vehicle.brand, vehicle.model);
    await images.deleteFolder(folder);

    await Vehicle.findByIdAndDelete(id);
  };

  const duplicateVehicle = async (id) => {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) throw new AppError('Vehicle not found', 404);

    const vehicleObj = vehicle.toObject();
    delete vehicleObj._id;
    delete vehicleObj.createdAt;
    delete vehicleObj.updatedAt;
    delete vehicleObj.__v;
    vehicleObj.model = `${vehicleObj.model} Copy`;

    return Vehicle.create(vehicleObj);
  };

  const deleteImage = async (id, imageUrl) => {
    if (!imageUrl) throw new AppError('Image URL is required', 400);
    if (!/\/upload\//.test(imageUrl)) throw new AppError('Invalid image URL format', 400);

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) throw new AppError('Vehicle not found', 404);

    const removed = await images.deleteImage(imageUrl);
    if (!removed) throw new AppError('Failed to delete image from Cloudinary', 500);

    if (vehicle.featuredImage === imageUrl) {
      vehicle.featuredImage = undefined;
    } else {
      vehicle.images = vehicle.images.filter((img) => img !== imageUrl);
    }

    return vehicle.save();
  };

  return {
    getAllVehicles,
    getVehicle,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    duplicateVehicle,
    deleteImage,
  };
}
