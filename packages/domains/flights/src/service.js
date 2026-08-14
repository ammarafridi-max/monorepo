import { AppError } from '@travel-suite/utils';

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

function splitFlightNumber(fn) {
  const m = String(fn || '').trim().match(/^([A-Z0-9]{2,3})\s*(.*)$/);
  return m
    ? { carrierCode: m[1], number: m[2].trim() }
    : { carrierCode: '', number: String(fn || '').trim() };
}

// SerpApi returns "YYYY-MM-DD HH:MM"; transformItinerary splits on 'T'.
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
    // Consumed by attachAirlines, then stripped. IATA-code lookups are ambiguous, so prefer this.
    airlineName: f.airline || null,
  };
}

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

  // Frontend contract: itineraries[0] is the outbound, itineraries[1] the return.
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

    try {
      const serpFlights = await buildSerpApiFlights({ type, origin, dest, departureDate, returnDate });
      if (serpFlights.length) return attachAirlines(serpFlights);
    } catch (err) {
      console.error('[flights] serpapi search failed:', err.message);
    }

    throw new AppError('No flights available', 404);
  };

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
