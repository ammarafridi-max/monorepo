import Amadeus from 'amadeus';

/**
 * @param {{ apiKey: string, apiSecret: string, hostname?: 'production' | 'test' }} deps
 * @returns {Amadeus}
 */
export function createAmadeusClient({ apiKey, apiSecret, hostname = 'production' }) {
  if (!apiKey || !apiSecret) {
    console.warn('[flights] AMADEUS_API_KEY / AMADEUS_API_SECRET are not set — flight searches will fail');
    // Return a stub so the server starts; requests will receive a 503 from the controller
    return null;
  }
  return new Amadeus({ clientId: apiKey, clientSecret: apiSecret, hostname });
}
