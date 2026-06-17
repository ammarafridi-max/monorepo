import { catchAsync, AppError } from '@travel-suite/utils';

export function createLocationController({ service }) {
  const getAutocomplete = catchAsync(async (req, res) => {
    const { query } = req.query;

    if (!query || query.length < 3) {
      return res.json({ status: 'success', data: [] });
    }

    const raw  = await service.getLocationsAutocomplete(query);
    const data = raw.map(service.formatLocation);

    res.json({ status: 'success', data });
  });

  const getCoordinates = catchAsync(async (req, res, next) => {
    const { query, id } = req.query;

    if (!query) return next(new AppError('Location not provided', 400));

    const { lat, lng } = await service.getLatLng(query, id);
    res.json({ status: 'success', data: { lat, lng } });
  });

  const getDistance = catchAsync(async (req, res, next) => {
    const { originLat, originLng, destLat, destLng } = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
      return next(new AppError('Please provide all four coordinates', 400));
    }

    const { distance, duration, distanceMeters, durationSeconds } =
      await service.calculateDistance(originLat, originLng, destLat, destLng);

    res.json({
      status: 'success',
      data: {
        distanceKm:  (distanceMeters / 1000).toFixed(2),
        durationMin: Math.ceil(durationSeconds / 60),
        text: { distance, duration },
      },
    });
  });

  const getUserLocation = catchAsync(async (req, res) => {
    const countryCode = await service.getUserCountry();
    res.json({ status: 'success', data: countryCode });
  });

  const getCities = catchAsync(async (req, res) => {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.json({ status: 'success', data: [] });
    }

    const data = await service.searchCities(query);
    res.json({ status: 'success', data });
  });

  return { getAutocomplete, getCoordinates, getDistance, getUserLocation, getCities };
}
