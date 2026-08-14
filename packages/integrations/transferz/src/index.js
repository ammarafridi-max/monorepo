import { AppError } from '@travel-suite/utils';

const DEFAULT_BASE_URL = 'https://api.transferz.com';

export const VEHICLE_CATEGORIES = [
  'SEDAN',
  'SUV',
  'MINIVAN',
  'VAN',
  'MINIBUS',
  'BUS',
  'BUSINESS_SEDAN',
  'BUSINESS_VAN',
  'FIRST_CLASS',
  'LIMOUSINE',
];

export const CANCELLATION_REASONS = [
  'NOT_NEEDED_ANYMORE',
  'NO_AVAILABILITY',
  'ADDRESS_INVALID',
  'INSUFFICIENT_TRAVELLER_DETAILS',
  'TECHNICAL_ISSUE',
  'PRICE_CALCULATION_ERROR',
  'NO_FLIGHT_NUMBER',
  'CANT_FULFILL_CUSTOMER_REQUEST',
  'FORCE_MAJEURE',
  'OTHER',
];

export function buildQuotePayload(trip) {
  const passengers = normalizePassengers(trip.passengers);
  const luggage = normalizeLuggage(trip.luggage);

  const payload = {
    origin: toLocation(trip.origin),
    destination: toLocation(trip.destination),
    pickupDateTime: trip.pickupDateTime,
    adultPassengers: passengers.adults,
    childPassengers: passengers.children,
    infantPassengers: passengers.infants,
    checkedLuggage: luggage.checked,
    carryOnLuggage: luggage.carryOn,
    currencyCode: trip.currencyCode,
  };

  if (trip.vehicleCategories?.length) {
    payload.limitToVehicleCategories = trip.vehicleCategories;
  }
  if (trip.requireInstantConfirmation) {
    payload.requireInstantConfirmation = true;
  }

  return payload;
}

export function buildBookingPayload({ quoteId, partnerReference, booker, traveller, travelAddons }) {
  return {
    partnerReference,
    booker: prune(booker),
    quotes: [
      {
        quoteId,
        traveller: prune(traveller),
        ...(travelAddons?.length ? { travelAddons } : {}),
      },
    ],
  };
}

export function createTransferzClient({ apiKey, baseUrl = DEFAULT_BASE_URL } = {}) {
  async function request(path, { method = 'GET', body, requestId } = {}) {
    if (!apiKey) {
      throw new AppError('Airport transfer supplier is not configured on this server', 503);
    }

    const headers = { 'X-API-Key': apiKey };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (requestId) headers['X-Request-ID'] = requestId;

    let res;
    try {
      res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      throw new AppError('Could not reach the airport transfer supplier', 502);
    }

    if (res.status === 204) return null;

    let json;
    try {
      json = await res.json();
    } catch {
      if (res.ok) return null;
      throw new AppError('Airport transfer supplier returned an invalid response', 502);
    }

    if (!res.ok) {
      const message = json?.message || json?.error || json?.detail || 'Airport transfer supplier error';
      throw new AppError(message, 502);
    }

    return json;
  }

  const getQuotes = (payload) => request('/quotes', { method: 'POST', body: payload });

  const createBooking = (payload, { requestId } = {}) =>
    request('/bookings', { method: 'POST', body: payload, requestId });

  const getBooking = (bookingId) => request(`/bookings/${bookingId}`);

  const payByInvoice = (bookingId, { requestId } = {}) =>
    request(`/bookings/${bookingId}/pay-by-invoice`, { method: 'POST', requestId });

  const cancelBooking = (bookingId, { reason = 'OTHER', acceptCharges, requestId } = {}) =>
    request(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: { reason, ...(acceptCharges !== undefined ? { acceptCharges } : {}) },
      requestId,
    });

  return { getQuotes, createBooking, getBooking, payByInvoice, cancelBooking };
}

function toLocation(loc) {
  if (!loc) return undefined;
  if (loc.iataCode) return { iataCode: loc.iataCode };
  if (loc.lat != null && loc.lng != null) return { coordinate: { lat: loc.lat, lng: loc.lng } };
  if (loc.addressSearchPhrase) {
    return {
      address: {
        addressSearchPhrase: loc.addressSearchPhrase,
        ...(loc.countryCode ? { countryCode: loc.countryCode } : {}),
      },
    };
  }
  return undefined;
}

function normalizePassengers(passengers) {
  if (passengers && typeof passengers === 'object') {
    return {
      adults: passengers.adults ?? 0,
      children: passengers.children ?? 0,
      infants: passengers.infants ?? 0,
    };
  }
  return { adults: Number(passengers) || 1, children: 0, infants: 0 };
}

function normalizeLuggage(luggage) {
  if (luggage && typeof luggage === 'object') {
    return { checked: luggage.checked ?? 0, carryOn: luggage.carryOn ?? 0 };
  }
  return { checked: Number(luggage) || 0, carryOn: 0 };
}

function prune(obj) {
  if (!obj) return obj;
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== ''),
  );
}
