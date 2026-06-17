import { AppError } from '@travel-suite/utils';

const AIRPORT_NAMES = [
  'DXB Terminal 1',
  'DXB Terminal 3 Metro Station',
  'DXB Terminal 3',
  'Terminal 1',
  'Terminal 2',
  'Terminal 3',
  'DXB T3 Terminal Car Parking',
  'Terminal One - Long Term Parking',
  'Terminal 3 Metro Station',
  'Terminal 3 Parking Masjid',
  'AUH - Terminal 3',
  'Abu Dhabi International Airport',
];

export function createLocationService({ googleMapsApiKey, ipInfoApiKey, airlabs }) {
  // City search backed by the AirLabs integration (injected client).
  async function searchCities(query) {
    if (!airlabs) {
      throw new AppError('City search is not configured on this server', 503);
    }
    const cities = await airlabs.suggestCities(query);
    return (cities ?? [])
      .map((c) => ({ name: c.name ?? c.city ?? '', countryCode: c.country_code ?? '' }))
      .filter((c) => c.name);
  }

  async function getLocationsAutocomplete(input) {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleMapsApiKey,
        'X-Goog-FieldMask': [
          'suggestions.placePrediction.placeId',
          'suggestions.placePrediction.structuredFormat.mainText.text',
          'suggestions.placePrediction.structuredFormat.secondaryText.text',
          'suggestions.placePrediction.types',
        ].join(','),
      },
      body: JSON.stringify({ input, includedRegionCodes: ['ae'] }),
    });

    if (!res.ok) throw new AppError('Error loading locations', 400);

    const { suggestions } = await res.json();
    return suggestions ?? [];
  }

  async function getLatLng(textQuery, id) {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleMapsApiKey,
        'X-Goog-FieldMask': 'places.location,places.displayName.text,places.id',
      },
      body: JSON.stringify({ textQuery }),
    });

    if (!res.ok) throw new AppError('Could not get location data', 400);

    const data = await res.json();
    const place = data.places?.find((p) => p?.id === id) ?? data.places?.[0];

    if (!place?.location) {
      throw new AppError('Could not find matching place for coordinates', 404);
    }

    const { latitude: lat, longitude: lng } = place.location;
    return { lat, lng };
  }

  function formatLocation(location) {
    const name    = location?.placePrediction?.structuredFormat?.mainText?.text;
    const address = location?.placePrediction?.structuredFormat?.secondaryText?.text;
    const id      = location?.placePrediction?.placeId;
    const types   = location?.placePrediction?.types ?? [];

    let type = 'location';
    if (types.includes('airport') || AIRPORT_NAMES.includes(name)) {
      type = 'airport';
    } else if (types.includes('hotel')) {
      type = 'hotel';
    }

    return { name, address, id, type };
  }

  async function calculateDistance(originLat, originLng, destLat, destLng) {
    const origin      = `${originLat},${originLng}`;
    const destination = `${destLat},${destLng}`;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&units=metric&key=${googleMapsApiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') throw new AppError('Error fetching distance data', 400);

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== 'OK') {
      throw new AppError('Unable to calculate distance for these coordinates', 404);
    }

    return {
      distance:        element.distance?.text,
      duration:        element.duration?.text,
      distanceMeters:  element.distance?.value,
      durationSeconds: element.duration?.value,
    };
  }

  async function getUserCountry() {
    const res = await fetch(`https://api.ipinfo.io/lite/me?token=${ipInfoApiKey}`);
    if (!res.ok) throw new AppError('Could not get user location', 400);
    const data = await res.json();
    return data.country_code;
  }

  return {
    getLocationsAutocomplete,
    getLatLng,
    formatLocation,
    calculateDistance,
    getUserCountry,
    searchCities,
  };
}
