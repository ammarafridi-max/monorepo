import { AppError } from "@travel-suite/utils";

const BASE_URL = "https://airlabs.co/api/v9";

/**
 * Creates an AirLabs API client bound to an API key.
 * Live calls only — no caching at this layer.
 * @param {{ apiKey: string }} config
 */
export function createAirLabsClient({ apiKey }) {
  async function request(path, params) {
    if (!apiKey) {
      throw new AppError(
        "Airport search is not configured on this server",
        503,
      );
    }

    const query = new URLSearchParams({ ...params, api_key: apiKey });
    const res = await fetch(`${BASE_URL}${path}?${query.toString()}`);

    let json;
    try {
      json = await res.json();
    } catch {
      throw new AppError("Airport provider returned an invalid response", 502);
    }

    // AirLabs errors come back as { error: { message, code } }
    if (json?.error) {
      throw new AppError(json.error.message || "Airport provider error", 502);
    }

    return json;
  }

  // /suggest returns multiple buckets in one response: airports, cities,
  // countries, cities_by_airports, airports_by_cities, etc. The helpers
  // below each hit the same endpoint and slice out one bucket.

  const suggestAirports = async (text) => {
    const json = await request("/suggest", { q: text });
    return json?.response?.airports ?? [];
  };

  const suggestCities = async (text) => {
    const json = await request("/suggest", { q: text });
    return json?.response?.cities ?? [];
  };

  return { suggestAirports, suggestCities };
}
