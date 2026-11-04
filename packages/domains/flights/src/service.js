import { AppError } from '@travel-suite/utils';
import { TICKET_VALIDITIES } from '@travel-suite/utils/ticket-validity';

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
    airlineName: f.airline || null,
  };
}

function attachAirlines(flights, logoFor = airlineLogo) {
  const detailFor = (code, nameByCode) => ({
    iataCode: code,
    businessName: nameByCode[code] || code,
    commonName: nameByCode[code] || code,
    logo: logoFor(code),
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
    .sort((a, b) => {
      const sa = stopProfile(a);
      const sb = stopProfile(b);
      return sa.worst - sb.worst || sa.total - sb.total;
    });
}

function stopsOfSegments(count) {
  return Math.max(count - 1, 0);
}

function stopProfile(flight) {
  const perLeg = flight.itineraries.map((it) => stopsOfSegments(it.segments.length));
  return { worst: Math.max(...perLeg), total: perLeg.reduce((a, b) => a + b, 0) };
}

function rankOffers(offers) {
  return [...offers].sort(
    (a, b) =>
      stopsOfSegments(a.flights?.length ?? 1) - stopsOfSegments(b.flights?.length ?? 1) ||
      (a.total_duration ?? 0) - (b.total_duration ?? 0),
  );
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

function isCarrierSellable(rule, validity) {
  if (!rule) return true;
  if (rule.isVisible === false) return false;
  if (!Array.isArray(rule.ticketValidities)) return true;
  if (rule.ticketValidities.length === 0) return false;
  if (!validity) return true;
  return rule.ticketValidities.includes(validity);
}

function itineraryFilter(rules, validity) {
  return (itinerary) =>
    itinerary.segments.every((s) => isCarrierSellable(rules.get(s.carrierCode), validity));
}

const AIRLINE_CACHE_TTL_MS = 10 * 60 * 1000;
const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_FIT = [{ width: 500, height: 500, crop: 'fit' }];
const HIGH_CONFIDENCE_SCORE = 100;
const ADOPT_CONCURRENCY = 4;

function bestCandidate(airline) {
  const list = airline.logoCandidates || [];
  if (!list.length) return null;
  return [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
}

function isHighConfidence(candidate) {
  if (!candidate || candidate.lowRes) return false;
  if (candidate.source !== 'wikimedia') return false;
  return (candidate.score ?? 0) >= HIGH_CONFIDENCE_SCORE;
}

async function runWithConcurrency(items, limit, worker) {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await worker(item);
    }
  });
  await Promise.all(runners);
}

export function createFlightService({ Airline, airlabs, serpapi, logoStorage, airlineCacheTtlMs = AIRLINE_CACHE_TTL_MS }) {
  function requireAirLabs() {
    if (!airlabs) throw new AppError('Airport search is not configured on this server', 503);
  }

  let airlineCache = new Map();
  let airlineCacheExpiry = 0;

  const refreshAirlineCache = async () => {
    if (!Airline) return airlineCache;
    const rows = await Airline.find().select('iataCode logo isVisible ticketValidities').lean();
    airlineCache = new Map(rows.map((r) => [r.iataCode, r]));
    airlineCacheExpiry = Date.now() + airlineCacheTtlMs;
    return airlineCache;
  };

  const getAirlineRules = async () => {
    if (Airline && Date.now() >= airlineCacheExpiry) {
      try {
        await refreshAirlineCache();
      } catch {
        airlineCacheExpiry = Date.now() + airlineCacheTtlMs;
      }
    }
    return airlineCache;
  };

  const invalidateAirlineCache = () => {
    airlineCacheExpiry = 0;
  };

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

  const listAirlines = async () => {
    if (!Airline) throw new AppError('Airline management is not configured on this server', 503);
    return Airline.find()
      .select('iataCode icaoCode businessName commonName logo isVisible ticketValidities logoCandidates logoCandidatesAt')
      .sort({ iataCode: 1 })
      .lean();
  };

  const IATA_PATTERN = /^[A-Z0-9]{2}$/;

  const normaliseCode = (value) => {
    const code = String(value || '').trim().toUpperCase();
    if (!IATA_PATTERN.test(code)) throw new AppError('Provide a valid two-character IATA code', 400);
    return code;
  };

  const setAirlineLogo = async ({ iataCode, buffer, mimetype }) => {
    if (!Airline) throw new AppError('Airline management is not configured on this server', 503);
    if (!logoStorage) throw new AppError('Logo storage is not configured on this server', 503);
    const code = normaliseCode(iataCode);
    if (!buffer?.length) throw new AppError('Please attach an image file', 400);
    if (!/^image\//.test(mimetype || '')) throw new AppError('The logo must be an image file', 400);

    const airline = await Airline.findOne({ iataCode: code });
    if (!airline) throw new AppError('No airline found for that code', 404);

    airline.logo = await logoStorage.saveFile(buffer, code, { transformation: LOGO_FIT, format: 'png' });
    await airline.save();
    invalidateAirlineCache();
    return airline;
  };

  const removeAirlineLogo = async (iataCode) => {
    if (!Airline) throw new AppError('Airline management is not configured on this server', 503);
    const code = normaliseCode(iataCode);
    const airline = await Airline.findOne({ iataCode: code });
    if (!airline) throw new AppError('No airline found for that code', 404);

    if (airline.logo && logoStorage) await logoStorage.deleteImage(airline.logo);
    airline.logo = null;
    await airline.save();
    invalidateAirlineCache();
    return airline;
  };

  const updateAirline = async ({ iataCode, isVisible, ticketValidities }) => {
    if (!Airline) throw new AppError('Airline management is not configured on this server', 503);
    const code = normaliseCode(iataCode);
    const airline = await Airline.findOne({ iataCode: code });
    if (!airline) throw new AppError('No airline found for that code', 404);

    if (isVisible !== undefined) {
      if (typeof isVisible !== 'boolean') throw new AppError('isVisible must be true or false', 400);
      airline.isVisible = isVisible;
    }

    if (ticketValidities !== undefined) {
      if (!Array.isArray(ticketValidities)) throw new AppError('ticketValidities must be a list', 400);
      const wanted = new Set(ticketValidities.map((value) => String(value).trim()));
      const unknown = [...wanted].find((value) => !TICKET_VALIDITIES.includes(value));
      if (unknown) throw new AppError(`Invalid validity option: ${unknown}`, 400);
      airline.ticketValidities = TICKET_VALIDITIES.filter((value) => wanted.has(value));
    }

    await airline.save();
    invalidateAirlineCache();
    return airline;
  };

  const storeLogoFromUrl = async (airline, url) => {
    let res;
    try {
      res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
    } catch {
      throw new AppError('Could not reach the logo source', 502);
    }
    if (!res.ok) throw new AppError(`Logo source returned ${res.status}`, 502);

    const mimetype = res.headers.get('content-type') || '';
    if (!/^image\//.test(mimetype)) throw new AppError('The logo source did not return an image', 502);

    const buffer = Buffer.from(await res.arrayBuffer());
    if (!buffer.length) throw new AppError('The logo source returned an empty file', 502);
    if (buffer.length > LOGO_MAX_BYTES) throw new AppError('That logo is over 2 MB', 400);

    airline.logo = await logoStorage.saveFile(buffer, airline.iataCode, {
      transformation: LOGO_FIT,
      format: 'png',
    });
    await airline.save();
    return airline;
  };

  const adoptLogoCandidate = async ({ iataCode, url }) => {
    if (!Airline) throw new AppError('Airline management is not configured on this server', 503);
    if (!logoStorage) throw new AppError('Logo storage is not configured on this server', 503);
    const code = normaliseCode(iataCode);

    const airline = await Airline.findOne({ iataCode: code });
    if (!airline) throw new AppError('No airline found for that code', 404);

    const candidate = (airline.logoCandidates || []).find((c) => c.url === url);
    if (!candidate) throw new AppError('That logo is not one of this airline\'s candidates', 400);

    await storeLogoFromUrl(airline, candidate.url);
    invalidateAirlineCache();
    return airline;
  };

  const adoptHighConfidenceLogos = async ({ dryRun = false } = {}) => {
    if (!Airline) throw new AppError('Airline management is not configured on this server', 503);
    if (!logoStorage && !dryRun) throw new AppError('Logo storage is not configured on this server', 503);

    const airlines = await Airline.find({
      $and: [
        { $or: [{ logo: { $in: [null, ''] } }, { logo: { $exists: false } }] },
        { 'logoCandidates.0': { $exists: true } },
      ],
    });

    const picks = [];
    for (const airline of airlines) {
      const candidate = bestCandidate(airline);
      if (isHighConfidence(candidate)) picks.push({ airline, candidate });
    }
    picks.sort((a, b) => a.airline.iataCode.localeCompare(b.airline.iataCode));

    const pending = picks.map(({ airline, candidate }) => ({
      iataCode: airline.iataCode,
      name: airline.commonName || airline.businessName || airline.iataCode,
      label: candidate.sourceLabel,
      width: candidate.width,
      height: candidate.height,
      mime: candidate.mime,
      licence: candidate.licence,
      score: candidate.score,
    }));

    if (dryRun) return { threshold: HIGH_CONFIDENCE_SCORE, dryRun: true, pending, adopted: [], failed: [] };

    const adopted = [];
    const failed = [];
    await runWithConcurrency(picks, ADOPT_CONCURRENCY, async ({ airline, candidate }) => {
      try {
        await storeLogoFromUrl(airline, candidate.url);
        adopted.push({ iataCode: airline.iataCode, logo: airline.logo });
      } catch (err) {
        failed.push({ iataCode: airline.iataCode, message: err.message });
      }
    });

    if (adopted.length) invalidateAirlineCache();
    return { threshold: HIGH_CONFIDENCE_SCORE, dryRun: false, pending, adopted, failed };
  };

  const assertSellable = async ({ carrierCodes = [], validity }) => {
    const rules = await getAirlineRules();
    const blocked = [...new Set(carrierCodes.filter(Boolean))].find(
      (code) => !isCarrierSellable(rules.get(code), validity),
    );
    if (!blocked) return;
    const rule = rules.get(blocked);
    const offersNothing = rule?.isVisible === false || rule?.ticketValidities?.length === 0;
    throw new AppError(
      offersNothing || !validity
        ? `We are not issuing reservations on ${blocked} right now`
        : `${blocked} does not offer a ${validity} reservation`,
      400,
    );
  };

  const buildSerpApiFlights = async ({ type, origin, dest, departureDate, returnDate, isSellable }) => {
    const outboundOffers = await serpapi.searchOneWay({
      departureId: origin,
      arrivalId: dest,
      outboundDate: departureDate,
    });
    const outbound = rankOffers(outboundOffers)
      .map(offerToItinerary)
      .filter((it) => it.segments.length && isSellable(it));
    if (!outbound.length) return [];

    if (type !== 'Return') {
      return outbound.slice(0, 20).map((it) => wrapFlight([it]));
    }

    const inboundOffers = await serpapi.searchOneWay({
      departureId: dest,
      arrivalId: origin,
      outboundDate: returnDate,
    });
    const inbound = rankOffers(inboundOffers)
      .map(offerToItinerary)
      .filter((it) => it.segments.length && isSellable(it));
    if (!inbound.length) return [];

    return outbound.slice(0, 12).map((out, i) => wrapFlight([out, inbound[i % inbound.length]]));
  };

  const searchFlights = async ({ type, from, to, departureDate, returnDate, quantity = {}, ticketValidity }) => {
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

    const validity = String(ticketValidity || '').trim();
    if (validity && !TICKET_VALIDITIES.includes(validity)) {
      throw new AppError('Please provide a valid ticket validity', 400);
    }

    const adults = Number(quantity.adults || 1);
    const totalPassengers = adults + Number(quantity.children || 0) + Number(quantity.infants || 0);
    if (adults < 1 || totalPassengers < 1 || totalPassengers > 9) {
      throw new AppError('Total passengers must be between 1 and 9, with at least 1 adult', 400);
    }

    try {
      const rules = await getAirlineRules();
      const serpFlights = await buildSerpApiFlights({
        type,
        origin,
        dest,
        departureDate,
        returnDate,
        isSellable: itineraryFilter(rules, validity),
      });
      if (serpFlights.length) {
        return attachAirlines(serpFlights, (code) => rules.get(code)?.logo || airlineLogo(code));
      }
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

  return {
    addAirlineByCode,
    listAirlines,
    setAirlineLogo,
    removeAirlineLogo,
    searchFlights,
    fetchAirports,
    fetchCities,
    updateAirline,
    adoptLogoCandidate,
    adoptHighConfidenceLogos,
    assertSellable,
    invalidateAirlineCache,
  };
}
