import { AppError } from "@travel-suite/utils";

const BASE_URL = "https://airlabs.co/api/v9";

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

    if (json?.error) {
      throw new AppError(json.error.message || "Airport provider error", 502);
    }

    return json;
  }

  const suggestAirports = async (text) => {
    const json = await request("/suggest", { q: text });
    return json?.response?.airports ?? [];
  };

  const suggestCities = async (text) => {
    const json = await request("/suggest", { q: text });
    return json?.response?.cities ?? [];
  };

  const getRoutes = async ({ depIata, arrIata } = {}) => {
    const params = {};
    if (depIata) params.dep_iata = depIata;
    if (arrIata) params.arr_iata = arrIata;
    const json = await request("/routes", params);
    return json?.response ?? [];
  };

  const getAirline = async (iataCode) => {
    if (!iataCode) return null;
    const json = await request("/airlines", { iata_code: iataCode });
    return json?.response?.[0] ?? null;
  };

  return { suggestAirports, suggestCities, getRoutes, getAirline };
}
