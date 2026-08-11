/**
 * Sherpa provider — NOT WIRED UP YET. No contract, no API key.
 *
 * Kept as a stub so the shape of the integration is settled and the seam is
 * real rather than theoretical. Two things to know before enabling it:
 *
 * 1. Sherpa's Trips endpoint takes `traveller.passports` and nothing else about
 *    the person. There is no residence or residence-permit field. So it cannot
 *    answer the UAE-residency cases, which is precisely where our curated rules
 *    earn their keep. Curated must stay ahead of it in the provider order.
 *
 * 2. It is trip-shaped, not question-shaped: it wants origin and destination
 *    airports plus dates. A "do I need a visa" lookup has none of those, so we
 *    synthesise a plausible trip. That is a workaround, and any answer that
 *    depends on the specific route or date will be wrong.
 *
 * Docs: https://docs.joinsherpa.io/requirements-api/endpoints/trips.html
 */

const SHERPA_TRIPS_URL = 'https://requirements-api.joinsherpa.io/v3/trips';

/** Minimal ISO2 -> a major airport, needed only because Trips demands nodes. */
function defaultAirportFor(iso2) {
  const map = { AE: 'DXB', GB: 'LHR', US: 'JFK', DE: 'FRA', FR: 'CDG', IT: 'FCO', ES: 'MAD', CA: 'YYZ', IN: 'DEL' };
  return map[String(iso2 || '').toUpperCase()] || null;
}

export function createSherpaProvider({ apiKey, fetchImpl = fetch, logger = console }) {
  if (!apiKey) return null;

  return {
    name: 'sherpa',

    async resolve({ nationality, destination, originCountry = 'AE', departureDate }) {
      const origin = defaultAirportFor(originCountry);
      const dest = defaultAirportFor(destination);
      // Without an airport on both ends there is no trip to ask about. Better to
      // decline than to invent a route and return a confident wrong answer.
      if (!origin || !dest) return null;

      const date = departureDate || new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);

      try {
        const res = await fetchImpl(SHERPA_TRIPS_URL, {
          method: 'POST',
          headers: { 'x-api-key': apiKey, 'Content-Type': 'application/vnd.api+json' },
          body: JSON.stringify({
            data: {
              type: 'TRIP',
              attributes: {
                locale: 'en-US',
                currency: 'AED',
                traveller: { passports: [String(nationality).toUpperCase()] },
                travelNodes: [
                  { type: 'ORIGIN', code: origin, date },
                  { type: 'DESTINATION', code: dest, date },
                ],
              },
            },
          }),
        });
        if (!res.ok) {
          logger.warn?.('[visa-requirements] sherpa returned ' + res.status);
          return null;
        }
        const body = await res.json();
        const group = (body?.data?.attributes?.informationGroups || []).find(
          (g) => g.type === 'VISA_REQUIREMENTS',
        );
        if (!group) return null;

        return {
          outcome: group.enforcement === 'NOT_REQUIRED' ? 'VISA_FREE' : 'VISA_REQUIRED',
          maxStayDays: null,
          note: group.headline || '',
          basis: 'nationality',
          wasFallback: false,
          source: 'sherpa',
          destination: String(destination).toUpperCase(),
          // Sherpa's own coarse mapping; it does not distinguish e-visa or
          // visa-on-arrival in the enforcement field, so treat with care.
          officialSourceName: 'sherpa°',
          officialSourceUrl: '',
          lastVerifiedAt: new Date(),
        };
      } catch (err) {
        logger.warn?.('[visa-requirements] sherpa lookup failed: ' + err.message);
        return null;
      }
    },
  };
}
