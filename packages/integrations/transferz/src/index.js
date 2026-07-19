import { AppError } from '@travel-suite/utils';

// Transferz Partner API client. Speaks Transferz's own language (net-priced
// quotes, supplier bookings) — brand-neutral and free of any markup/retail
// concept, which belongs to the consuming domain. Docs: developers.transferz.com
const DEFAULT_BASE_URL = 'https://api.transferz.com';

// Transferz vehicle categories accepted by `limitToVehicleCategories` on a quote
// request and returned as `vehicleCategory` on each quote. Kept here so the
// consuming domain can map them to its own display names without guessing.
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

// Reasons Transferz accepts on POST /bookings/{id}/cancel.
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

/**
 * Build the POST /quotes request body from a normalized trip.
 *
 * Each location is `{ iataCode?, lat?, lng?, addressSearchPhrase?, countryCode? }`.
 * Transferz resolves an origin/destination from ONE identifier, so we prefer the
 * most precise available: IATA code (airports) → coordinates → free-text address.
 *
 * Passengers/luggage accept either a plain total (all treated as adults / checked)
 * or a `{ adults, children, infants }` / `{ checked, carryOn }` breakdown.
 *
 * @param {{ origin: object, destination: object, pickupDateTime: string,
 *   passengers: number|object, luggage?: number|object, currencyCode: string,
 *   vehicleCategories?: string[], requireInstantConfirmation?: boolean }} trip
 */
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

/**
 * Build the POST /bookings request body. `partnerReference` is our own
 * idempotency/reconciliation handle and MUST be stable per booking so a retried
 * fulfillment never creates a second supplier booking. Flight number rides on the
 * traveller (Transferz collects it at booking time, not on the quote).
 *
 * @param {{ quoteId: number, partnerReference: string,
 *   booker: { email: string, firstName?: string, lastName?: string, phone?: string },
 *   traveller: { email: string, firstName?: string, lastName?: string, phone?: string,
 *     flightNumber?: string, driverComments?: string },
 *   travelAddons?: Array<{ quoteTravelAddonId: number, amount: number }> }} input
 */
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

/**
 * Creates a Transferz API client bound to an API key. Live calls only.
 * @param {{ apiKey: string, baseUrl?: string }} config
 */
export function createTransferzClient({ apiKey, baseUrl = DEFAULT_BASE_URL } = {}) {
  async function request(path, { method = 'GET', body, requestId } = {}) {
    if (!apiKey) {
      // Fail closed: never fall back to an unpriced/unbooked state silently.
      throw new AppError('Airport transfer supplier is not configured on this server', 503);
    }

    const headers = { 'X-API-Key': apiKey };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    // X-Request-ID is Transferz's idempotency key for mutating calls.
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

  // Real-time availability + net pricing for one route. Returns
  // { origin, destination, quotes: [{ id, vehicleCategory, price, vat, commission,
  //   currencyCode, expires, freeCancellationUntil, ... }] }. `price` is the NET
  // rate we pay under pay-by-invoice; retail markup is applied by the caller.
  const getQuotes = (payload) => request('/quotes', { method: 'POST', body: payload });

  // Create a supplier booking against a prior quoteId. Booking starts NOT_PAID and
  // must be settled (see payByInvoice) to confirm. Pass a stable requestId to make
  // the call idempotent across retries.
  const createBooking = (payload, { requestId } = {}) =>
    request('/bookings', { method: 'POST', body: payload, requestId });

  const getBooking = (bookingId) => request(`/bookings/${bookingId}`);

  // Settle a booking on invoice terms (we, the partner, are billed periodically;
  // we have already collected from the customer via our own Stripe). Confirms the
  // booking. Idempotent via requestId.
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

// -- internal helpers ---------------------------------------------------------

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
  // A single total counts everyone as an adult — the frontend collects one number.
  return { adults: Number(passengers) || 1, children: 0, infants: 0 };
}

function normalizeLuggage(luggage) {
  if (luggage && typeof luggage === 'object') {
    return { checked: luggage.checked ?? 0, carryOn: luggage.carryOn ?? 0 };
  }
  return { checked: Number(luggage) || 0, carryOn: 0 };
}

// Drop null/undefined/'' so we never send empty strings Transferz would reject.
function prune(obj) {
  if (!obj) return obj;
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== ''),
  );
}
