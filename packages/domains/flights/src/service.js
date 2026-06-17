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

export function createFlightService({ Airline, amadeus, airlabs }) {
  function requireAmadeus() {
    if (!amadeus) throw new AppError('Flight search is not configured on this server', 503);
  }

  function requireAirLabs() {
    if (!airlabs) throw new AppError('Airport search is not configured on this server', 503);
  }

  const addAirlineByCode = async (airlineCode) => {
    requireAmadeus();
    const exists = await Airline.findOne({ iataCode: airlineCode });
    if (exists) throw new AppError('This airline data already exists', 409);

    const response = await amadeus.referenceData.airlines.get({ airlineCodes: airlineCode });
    const [data] = response.data || [];

    if (!data || !data.icaoCode || data.businessName === 'UNDEFINED') {
      throw new AppError('No airline found', 404);
    }

    return Airline.create({
      iataCode: data.iataCode,
      icaoCode: data.icaoCode,
      businessName: data.businessName,
      commonName: data.commonName,
      logo: airlineLogo(data.iataCode),
    });
  };

  const enrichFlightsWithAirlines = async (flights) => {
    const airlineCodes = [...new Set(flights.flatMap((f) => f.validatingAirlineCodes))];
    const airlinesInDb = await Airline.find({ iataCode: { $in: airlineCodes } });
    const airlineMap = new Map(airlinesInDb.map((a) => [a.iataCode, a]));

    const missingCodes = airlineCodes.filter((code) => !airlineMap.has(code));

    if (missingCodes.length) {
      const response = await amadeus.referenceData.airlines.get({ airlineCodes: missingCodes.join() });
      const newAirlines = (response.data || []).map((a) => ({
        iataCode: a.iataCode,
        icaoCode: a.icaoCode,
        businessName: a.businessName,
        commonName: a.commonName,
        logo: airlineLogo(a.iataCode),
      }));

      await Airline.insertMany(newAirlines, { ordered: false });
      newAirlines.forEach((a) => airlineMap.set(a.iataCode, a));
    }

    // Back-fill logo on existing records that were inserted before this field existed
    const logolessInDb = airlinesInDb.filter((a) => !a.logo && airlineLogo(a.iataCode));
    if (logolessInDb.length) {
      await Promise.all(
        logolessInDb.map((a) =>
          Airline.updateOne({ iataCode: a.iataCode }, { $set: { logo: airlineLogo(a.iataCode) } })
        )
      );
      logolessInDb.forEach((a) => { a.logo = airlineLogo(a.iataCode); });
    }

    return flights
      .map((flight) => ({
        ...flight,
        itineraries: flight.itineraries.map((it) => ({
          ...it,
          segments: it.segments.map((seg) => ({
            ...seg,
            airlineDetail: airlineMap.get(seg.carrierCode) || {},
          })),
        })),
        airlineDetails: flight.validatingAirlineCodes.map((code) => airlineMap.get(code) || {}),
      }))
      .sort((a, b) => a.itineraries[0].segments.length - b.itineraries[0].segments.length);
  };

  const searchFlights = async ({ type, from, to, departureDate, returnDate, quantity = {} }) => {
    requireAmadeus();
    if (!from || !to || !departureDate) {
      throw new AppError('Please provide departure, arrival, and departure date', 400);
    }

    if (type === 'Return' && !returnDate) {
      throw new AppError('Please provide a return date for return trips', 400);
    }

    const originLocationCode = extractIataCode(from);
    const destinationLocationCode = extractIataCode(to);

    if (!originLocationCode || !destinationLocationCode) {
      throw new AppError('Please provide valid airport selections', 400);
    }

    const adults = Number(quantity.adults || 1);
    const children = Number(quantity.children || 0);
    const infants = Number(quantity.infants || 0);
    const totalPassengers = adults + children + infants;

    if (adults < 1 || totalPassengers < 1 || totalPassengers > 9) {
      throw new AppError('Total passengers must be between 1 and 9, with at least 1 adult', 400);
    }

    const params = {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults,
      ...(children > 0 ? { children } : {}),
      ...(infants > 0 ? { infants } : {}),
      ...(type === 'Return' && returnDate ? { returnDate } : {}),
    };

    const response = await amadeus.shopping.flightOffersSearch.get(params);
    if (!response?.data) throw new AppError('No flights available', 404);

    const flights = response.data.filter((f) => f.itineraries[0].segments.length <= 2);
    return enrichFlightsWithAirlines(flights);
  };

  // Live airport search via AirLabs /suggest. One endpoint handles both
  // IATA codes ("DXB") and freeform text ("dubai"). We keep only entries
  // whose `type === 'airport'` (drops airbases, heliports, seaplane bases),
  // sort by popularity, and map to the legacy Amadeus-compatible shape
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
