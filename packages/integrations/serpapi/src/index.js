import { AppError } from '@travel-suite/utils';

const BASE_URL = 'https://serpapi.com/search.json';

// Google Flights `type` values
const TYPE_ROUND_TRIP = 1;
const TYPE_ONE_WAY = 2;

// `stops`: 1=Nonstop, 2=<=1 stop, 3=<=2 stops. We always want up to 2 stops.
const STOPS_UP_TO_TWO = 3;

/**
 * Creates a SerpApi client scoped to Google Flights search.
 * Search-only usage: we read schedules/itineraries and ignore fares.
 * @param {{ apiKey: string }} config
 */
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

    // SerpApi surfaces problems as { error: "..." }
    if (json?.error) {
      // "hasn't returned any results" is a normal empty search, not a failure.
      if (/hasn't returned any results|no results/i.test(json.error)) {
        return { best_flights: [], other_flights: [] };
      }
      throw new AppError(json.error || 'Flight provider error', 502);
    }

    return json;
  }

  /**
   * One-way Google Flights search. Returns the combined best + other flight
   * offers (each offer is { flights[], layovers[], total_duration, price, ... }).
   * We run round trips as two one-way searches, so this covers both directions.
   */
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
