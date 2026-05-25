import { AppError } from '@travel-suite/utils';

const BASE_URL = 'https://airlabs.co/api/v9';
// Trim the payload to only the fields the airport dropdown needs.
// is_major/is_international let us filter out minor facilities (seaplane bases etc).
const AIRPORT_FIELDS = 'name,iata_code,icao_code,city,city_code,country_code,is_major,is_international';

/**
 * Creates an AirLabs API client bound to an API key.
 * Live calls only — no caching at this layer.
 * @param {{ apiKey: string }} config
 */
export function createAirLabsClient({ apiKey }) {
  async function request(path, params) {
    if (!apiKey) {
      throw new AppError('Airport search is not configured on this server', 503);
    }

    const query = new URLSearchParams({ ...params, api_key: apiKey });
    const res = await fetch(`${BASE_URL}${path}?${query.toString()}`);

    let json;
    try {
      json = await res.json();
    } catch {
      throw new AppError('Airport provider returned an invalid response', 502);
    }

    // AirLabs errors come back as { error: { message, code } }
    if (json?.error) {
      throw new AppError(json.error.message || 'Airport provider error', 502);
    }

    return json;
  }

  // Exact-code lookup, e.g. "DXB". /airports filters by exact code only.
  const getAirportByIata = async (iataCode) => {
    const json = await request('/airports', {
      iata_code: iataCode.toUpperCase(),
      _fields: AIRPORT_FIELDS,
    });
    return Array.isArray(json) ? json : (json?.response ?? []);
  };

  // Fuzzy name/city autocomplete, e.g. "dubai". /suggest is built for this.
  const suggestAirports = async (text) => {
    const json = await request('/suggest', { q: text });
    const response = json?.response;
    if (Array.isArray(response)) return response;
    return response?.airports ?? [];
  };

  return { getAirportByIata, suggestAirports };
}
