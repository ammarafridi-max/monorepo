import mongoose from 'mongoose';
import { AppError } from '@travel-suite/utils';

function validateParams({ pickupZone, dropoffZone, tripType, distance, hoursBooked }) {
  if (!pickupZone) throw new AppError('Pickup zone is required.', 400);
  if (!tripType) throw new AppError('Trip type is required.', 400);

  if (tripType === 'distance') {
    if (!dropoffZone) throw new AppError('Dropoff zone is required for distance trips.', 400);
    if (!distance) throw new AppError('Distance is required for distance trips.', 400);
  }

  if (tripType === 'hourly' && !hoursBooked) {
    throw new AppError('Hours booked is required for hourly trips.', 400);
  }
  if (tripType === 'hourly') {
    const hours = Number(hoursBooked);
    if (!Number.isInteger(hours) || hours < 1 || hours > 8) {
      throw new AppError('Hours booked must be an integer between 1 and 8 for hourly trips.', 400);
    }
  }

  const isValidObjectId = (id) =>
    mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;

  const pickupZoneId = isValidObjectId(pickupZone) ? new mongoose.Types.ObjectId(pickupZone) : null;
  const dropoffZoneId = dropoffZone && isValidObjectId(dropoffZone) ? new mongoose.Types.ObjectId(dropoffZone) : null;

  if (!pickupZoneId) throw new AppError('Invalid pickup zone ID.', 400);

  return { pickupZoneId, dropoffZoneId };
}

function extractAvailableVehicles(rule) {
  if (!rule) return [];
  return rule.vehicles.filter((v) => v.available && v.vehicle).map((v) => v.vehicle);
}

function findPricingForVehicle(vehicleId, pricingRules) {
  if (!pricingRules?.length) return null;
  return pricingRules.find((rule) => rule.vehicles.some((v) => String(v?._id) === String(vehicleId))) || null;
}

function calculateVehiclePrice(vehicle, tripType, distance, hoursBooked, matchedRule) {
  let totalPrice = 0;
  let calculationMethod = '';

  if (tripType === 'distance') {
    if (matchedRule) {
      totalPrice = matchedRule.pricing.oneWay;
      calculationMethod = 'zone-based';
    } else {
      const km = parseFloat(distance) || 0;
      const perKm = vehicle.pricing?.pricePerKm || 0;
      const initialPrice = vehicle.pricing?.initialPrice || 0;
      totalPrice = Math.ceil(initialPrice + km * perKm);
      calculationMethod = 'distance-fallback';
    }
  }

  if (tripType === 'hourly') {
    const hours = Number(hoursBooked) || 0;
    const hourlyRateByTier = vehicle.pricing?.hourlyRates?.[`hour${hours}`];
    const legacyPerHour = vehicle.pricing?.pricePerHour || 0;
    totalPrice = Number.isFinite(hourlyRateByTier) ? Math.ceil(hourlyRateByTier) : Math.ceil(hours * legacyPerHour);
    calculationMethod = 'hourly';
  }

  return { totalPrice, calculationMethod };
}

function formatVehicle(vehicle, totalPrice, calculationMethod) {
  return {
    id: vehicle._id,
    name: `${vehicle.brand} ${vehicle.model}`,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    passengers: vehicle.passengers,
    luggage: vehicle.luggage,
    class: vehicle.class,
    type: vehicle.type,
    fuel: vehicle.fuel,
    description: vehicle.description,
    featuredImage: vehicle.featuredImage,
    images: vehicle.images,
    pricing: vehicle.pricing,
    totalPrice,
    calculationMethod,
  };
}

export function createBookingPricingService({ AvailabilityRule, PricingRule }) {
  const getAvailabilityRule = async (pickupZoneId, dropoffZoneId) => {
    const query = { isActive: true, pickupZones: pickupZoneId };
    if (dropoffZoneId) query.dropoffZones = dropoffZoneId;

    return AvailabilityRule.findOne(query)
      .populate({
        path: 'vehicles.vehicle',
        select: 'brand model year description passengers luggage type fuel class featuredImage images pricing',
      })
      .lean();
  };

  const getPricingRules = async (pickupZoneId, dropoffZoneId) => {
    const filter = { pickupZones: pickupZoneId };
    if (dropoffZoneId) filter.dropoffZones = dropoffZoneId;
    const rules = await PricingRule.find(filter).select('vehicles pricing.oneWay pricing.return');
    return rules || [];
  };

  const getVehiclesForTrip = async (query) => {
    const { pickupZoneId, dropoffZoneId } = validateParams(query);

    const availabilityRule = await getAvailabilityRule(pickupZoneId, dropoffZoneId);
    if (!availabilityRule) throw new AppError('No availability rules found for these zones.', 404);

    const availableVehicles = extractAvailableVehicles(availabilityRule);
    if (!availableVehicles.length) throw new AppError('No available vehicles found for these zones.', 404);

    const pricingRules = await getPricingRules(pickupZoneId, dropoffZoneId);

    const vehiclesWithPrices = availableVehicles.map((vehicle) => {
      const matchedRule = findPricingForVehicle(vehicle._id, pricingRules);
      const { totalPrice, calculationMethod } = calculateVehiclePrice(
        vehicle,
        query.tripType,
        query.distance,
        query.hoursBooked,
        matchedRule,
      );
      return formatVehicle(vehicle, totalPrice, calculationMethod);
    });

    return vehiclesWithPrices.sort((a, b) => a.totalPrice - b.totalPrice);
  };

  return { getVehiclesForTrip };
}
