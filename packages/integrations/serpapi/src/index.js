import { AppError } from '@travel-suite/utils';

const BASE_URL = 'https://serpapi.com/search.json';

const TYPE_ROUND_TRIP = 1;
const TYPE_ONE_WAY = 2;

const STOPS_UP_TO_TWO = 3;

export function createSerpApiClient({ apiKey }) {
  async function request(params) {
    if (!apiKey) {
      throw new AppError('Search provider is not configured on this server', 503);
    }

    const query = new URLSearchParams({ ...params, api_key: apiKey });
    let res;
    try {
      res = await fetch(`${BASE_URL}?${query.toString()}`);
    } catch {
      throw new AppError('Search provider is unreachable', 502);
    }

    let json;
    try {
      json = await res.json();
    } catch {
      throw new AppError('Search provider returned an invalid response', 502);
    }

    if (json?.error) {
      if (/hasn't returned any results|no results/i.test(json.error)) {
        return {};
      }
      throw new AppError(json.error || 'Search provider error', 502);
    }

    return json;
  }

  const searchOneWay = async ({ departureId, arrivalId, outboundDate, currency = 'AED' }) => {
    const json = await request({
      engine: 'google_flights',
      type: String(TYPE_ONE_WAY),
      stops: String(STOPS_UP_TO_TWO),
      departure_id: departureId,
      arrival_id: arrivalId,
      outbound_date: outboundDate,
      currency,
      hl: 'en',
    });
    return [...(json.best_flights ?? []), ...(json.other_flights ?? [])];
  };

  const money = (rate) => {
    const amount = rate?.extracted_lowest ?? rate?.extracted_display_price;
    return Number.isFinite(amount) ? { amount, display: rate?.lowest ?? rate?.display_price ?? null } : null;
  };

  const toHotel = (property) => ({
    propertyToken: property.property_token ?? null,
    name: property.name ?? null,
    type: property.type ?? null,
    stars: property.extracted_hotel_class ?? null,
    starsLabel: property.hotel_class ?? null,
    rating: property.overall_rating ?? null,
    reviews: property.reviews ?? null,
    thumbnail: property.images?.[0]?.thumbnail ?? null,
    amenities: property.amenities?.slice(0, 6) ?? [],
    ratePerNight: money(property.rate_per_night),
    totalRate: money(property.total_rate),
    gps: property.gps_coordinates ?? null,
    link: property.link ?? null,
  });

  const searchHotels = async ({ query, checkIn, checkOut, adults = 2, children = 0, currency = 'USD', countryCode }) => {
    const json = await request({
      engine: 'google_hotels',
      q: query,
      check_in_date: checkIn,
      check_out_date: checkOut,
      adults: String(adults),
      ...(children ? { children: String(children) } : {}),
      currency,
      ...(countryCode ? { gl: String(countryCode).toLowerCase() } : {}),
      hl: 'en',
    });
    return (json.properties ?? []).filter((p) => p.name).map(toHotel);
  };

  const getHotelDetails = async ({ propertyToken, checkIn, checkOut, adults = 2, currency = 'USD', countryCode }) => {
    const json = await request({
      engine: 'google_hotels',
      property_token: propertyToken,
      check_in_date: checkIn,
      check_out_date: checkOut,
      adults: String(adults),
      currency,
      ...(countryCode ? { gl: String(countryCode).toLowerCase() } : {}),
      hl: 'en',
    });
    if (!json.name) return null;
    return {
      ...toHotel(json),
      address: json.address ?? null,
      phone: json.phone ?? null,
      checkInTime: json.check_in_time ?? null,
      checkOutTime: json.check_out_time ?? null,
    };
  };

  return { searchOneWay, searchHotels, getHotelDetails, TYPE_ROUND_TRIP, TYPE_ONE_WAY };
}
