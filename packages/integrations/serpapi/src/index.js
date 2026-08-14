import { AppError } from '@travel-suite/utils';

const BASE_URL = 'https://serpapi.com/search.json';

const TYPE_ROUND_TRIP = 1;
const TYPE_ONE_WAY = 2;

const STOPS_UP_TO_TWO = 3;

export function createSerpApiClient({ apiKey }) {
  async function request(params) {
    if (!apiKey) {
      throw new AppError('Flight search is not configured on this server', 503);
    }

    const query = new URLSearchParams({ ...params, api_key: apiKey });
    let res;
    try {
      res = await fetch(`${BASE_URL}?${query.toString()}`);
    } catch {
      throw new AppError('Flight provider is unreachable', 502);
    }

    let json;
    try {
      json = await res.json();
    } catch {
      throw new AppError('Flight provider returned an invalid response', 502);
    }

    if (json?.error) {
      if (/hasn't returned any results|no results/i.test(json.error)) {
        return { best_flights: [], other_flights: [] };
      }
      throw new AppError(json.error || 'Flight provider error', 502);
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

  return { searchOneWay, TYPE_ROUND_TRIP, TYPE_ONE_WAY };
}
