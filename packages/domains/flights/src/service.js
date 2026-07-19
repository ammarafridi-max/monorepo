import { AppError } from '@travel-suite/utils';

// Static logo files bundled with each backend at /airlines/{IATA_CODE}.{ext}
const AIRLINE_LOGO_EXT = {
  A3:'png', AA:'jpg', AF:'png', AI:'jpg', AT:'png', AY:'png', AZ:'png',
  BA:'jpg', EI:'jpg', EK:'png', ET:'png', EY:'png', FZ:'png', G9:'png',
  GF:'png', HM:'jpg', HR:'png', HY:'png', IB:'png', IC:'png', KA:'webp',
  KL:'jpg', KQ:'png', KU:'png', LA:'jpg', LH:'png', LX:'png', ME:'png',
  MS:'png', NW:'webp', OK:'png', OS:'png', QF:'png', QR:'png', RB:'jpg',
  RJ:'png', SA:'png', SQ:'png', SV:'png', TK:'png', UA:'jpg', UK:'jpg',
  VF:'png', VS:'png', WY:'png', XY:'png',
};

function airlineLogo(iataCode) {
  const ext = AIRLINE_LOGO_EXT[iataCode];
  return ext ? `/airlines/${iataCode}.${ext}` : null;
}

function extractIataCode(locationString = '') {
  const start = locationString.indexOf('(') + 1;
  const end = locationString.indexOf(')');
  return start > 0 && end > start ? locationString.slice(start, end) : null;
}

function minutesToISO(min) {
  const total = Math.max(0, Math.round(Number(min) || 0));
  return `PT${Math.floor(total / 60)}H${total % 60}M`;
}

// ---------------------------------------------------------------------------
// SerpApi Google Flights -> flight-offers shape adapter
// ---------------------------------------------------------------------------
// Google Flights returns full itineraries (nonstop / 1-stop / 2-stop) with a
// segment array, so there's no stitching to do. We only reshape into the
// flight-offer contract the frontend consumes (itineraries[].segments[]
// with `.at` datetimes, ISO `duration`, `number`, `carrierCode`). Fares are
// ignored — the ticket is priced by validity, not the flight.

// "EK 1" -> { carrierCode: 'EK', number: '1' }
function splitFlightNumber(fn) {
  const m = String(fn || '').trim().match(/^([A-Z0-9]{2,3})\s*(.*)$/);
  return m
    ? { carrierCode: m[1], number: m[2].trim() }
    : { carrierCode: '', number: String(fn || '').trim() };
}

// SerpApi times are "YYYY-MM-DD HH:MM" (local). transformItinerary splits on
// 'T' and `new Date(at)` must parse it, so normalise to "YYYY-MM-DDTHH:MM:00".
function serpTimeToISO(t) {
  const s = String(t || '').trim();
  if (!s) return s;
  const [date, time = '00:00'] = s.split(' ');
  return `${date}T${time}:00`;
}

function segmentFromSerp(f) {
  const { carrierCode, number } = splitFlightNumber(f.flight_number);
  return {
    departure: { iataCode: f.departure_airport?.id, at: serpTimeToISO(f.departure_airport?.time) },
    arrival: { iataCode: f.arrival_airport?.id, at: serpTimeToISO(f.arrival_airport?.time) },
    duration: minutesToISO(f.duration),
    carrierCode,
    number,
    ...(f.airplane ? { aircraft: { code: f.airplane } } : {}),
    // Google's marketing airline name — authoritative for the flight shown, and
    // avoids ambiguous IATA-code lookups (e.g. AirLabs maps "PC" to a cargo firm
    // instead of Pegasus). Consumed by attachAirlines, then stripped.
    airlineName: f.airline || null,
  };
}

// Attach airline display data using SerpApi's per-segment airline name (source
// of truth) and the bundled local logo map. Pure/sync — no DB or AirLabs round
// trips. Nonstop itineraries sort first (fewest segments).
function attachAirlines(flights) {
  const detailFor = (code, nameByCode) => ({
    iataCode: code,
    businessName: nameByCode[code] || code,
    commonName: nameByCode[code] || code,
    logo: airlineLogo(code),
  });

  return flights
    .map((flight) => {
      const nameByCode = {};
      flight.itineraries.forEach((it) =>
        it.segments.forEach((s) => {
          if (s.carrierCode && s.airlineName && !nameByCode[s.carrierCode]) {
            nameByCode[s.carrierCode] = s.airlineName;
          }
        }),
      );
      return {
        ...flight,
        itineraries: flight.itineraries.map((it) => ({
          ...it,
          segments: it.segments.map(({ airlineName, ...s }) => ({
            ...s,
            airlineDetail: detailFor(s.carrierCode, nameByCode),
          })),
        })),
        airlineDetails: flight.validatingAirlineCodes.map((code) => detailFor(code, nameByCode)),
      };
    })
    .sort((a, b) => a.itineraries[0].segments.length - b.itineraries[0].segments.length);
}

function offerToItinerary(offer) {
  return {
    duration: minutesToISO(offer.total_duration),
    segments: (offer.flights || []).map(segmentFromSerp),
  };
}

function wrapFlight(itineraries) {
  const validatingAirlineCodes = [
    ...new Set(itineraries.flatMap((it) => it.segments.map((s) => s.carrierCode)).filter(Boolean)),
  ];
  return { itineraries, validatingAirlineCodes };
}

// Flight search is served by SerpApi (Google Flights). AirLabs supplies airport
// and airline reference data.
export function createFlightService({ Airline, airlabs, serpapi }) {
  function requireAirLabs() {
    if (!airlabs) throw new AppError('Airport search is not configured on this server', 503);
  }

  const addAirlineByCode = async (airlineCode) => {
    requireAirLabs();
    const exists = await Airline.findOne({ iataCode: airlineCode });
    if (exists) throw new AppError('This airline data already exists', 409);

    const data = await airlabs.getAirline(airlineCode);
    if (!data || !data.iata_code) throw new AppError('No airline found', 404);

    return Airline.create({
      iataCode: data.iata_code,
      icaoCode: data.icao_code || null,
      businessName: data.name,
      commonName: data.name,
      logo: airlineLogo(data.iata_code),
    });
  };

  // SerpApi flight builder. Returns unenriched flights in the flight-offer
  // shape the frontend consumes. Return trips are two one-way searches, zipped
  // into out+return pairs (frontend reads itineraries[0]=outbound, itineraries[1]=return).
  const buildSerpApiFlights = async ({ type, origin, dest, departureDate, returnDate }) => {
    const outboundOffers = await serpapi.searchOneWay({
      departureId: origin,
      arrivalId: dest,
      outboundDate: departureDate,
    });
    const outbound = outboundOffers.map(offerToItinerary).filter((it) => it.segments.length);
    if (!outbound.length) return [];

    if (type !== 'Return') {
      return outbound.slice(0, 20).map((it) => wrapFlight([it]));
    }

    const inboundOffers = await serpapi.searchOneWay({
      departureId: dest,
      arrivalId: origin,
      outboundDate: returnDate,
    });
    const inbound = inboundOffers.map(offerToItinerary).filter((it) => it.segments.length);
    if (!inbound.length) return [];

    return outbound.slice(0, 12).map((out, i) => wrapFlight([out, inbound[i % inbound.length]]));
  };

  const searchFlights = async ({ type, from, to, departureDate, returnDate, quantity = {} }) => {
    if (!serpapi) {
      throw new AppError('Flight search is not configured on this server', 503);
    }
    if (!from || !to || !departureDate) {
      throw new AppError('Please provide departure, arrival, and departure date', 400);
    }
    if (type === 'Return' && !returnDate) {
      throw new AppError('Please provide a return date for return trips', 400);
    }

    const origin = extractIataCode(from);
    const dest = extractIataCode(to);
    if (!origin || !dest) {
      throw new AppError('Please provide valid airport selections', 400);
    }

    const adults = Number(quantity.adults || 1);
    const totalPassengers = adults + Number(quantity.children || 0) + Number(quantity.infants || 0);
    if (adults < 1 || totalPassengers < 1 || totalPassengers > 9) {
      throw new AppError('Total passengers must be between 1 and 9, with at least 1 adult', 400);
    }

    // SerpApi carries airline names inline, so results enrich synchronously.
    try {
      const serpFlights = await buildSerpApiFlights({ type, origin, dest, departureDate, returnDate });
      if (serpFlights.length) return attachAirlines(serpFlights);
    } catch (err) {
      console.error('[flights] serpapi search failed:', err.message);
    }

    throw new AppError('No flights available', 404);
  };

  // Live airport search via AirLabs /suggest. One endpoint handles both
  // IATA codes ("DXB") and freeform text ("dubai"). We keep only entries
  // whose `type === 'airport'` (drops airbases, heliports, seaplane bases),
  // sort by popularity, and map to the airport shape
  // ({ iataCode, address: { cityName } }) so existing callers and the
  // frontend dropdown work unchanged.
  function validateKeyword(keyword, label) {
    const kw = (keyword || '').trim();
    if (!kw || kw.length < 3) {
      throw new AppError(`${label} keyword must be at least 3 characters`, 400);
    }
    return kw;
  }

  const fetchAirports = async (keyword) => {
    requireAirLabs();
    const kw = validateKeyword(keyword, 'Airport');

    const raw = await airlabs.suggestAirports(kw);

    return (raw || [])
      .filter((a) => a?.iata_code && a?.type === 'airport')
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      .map((a) => ({
        iataCode: a.iata_code,
        icaoCode: a.icao_code ?? null,
        name: a.name ?? null,
        countryCode: a.country_code ?? null,
        address: { cityName: a.city || a.city_code || a.iata_code },
      }));
  };

  // Same /suggest endpoint, different bucket. Returned shape mirrors the
  // airport contract so callers can render either in the same dropdown.
  const fetchCities = async (keyword) => {
    requireAirLabs();
    const kw = validateKeyword(keyword, 'City');

    const raw = await airlabs.suggestCities(kw);

    return (raw || [])
      .filter((c) => c?.city_code)
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      .map((c) => ({
        cityCode: c.city_code,
        name: c.name ?? null,
        countryCode: c.country_code ?? null,
        slug: c.slug ?? null,
        timezone: c.timezone ?? null,
      }));
  };

  return { addAirlineByCode, searchFlights, fetchAirports, fetchCities };
}
