const LITEAPI_URL = 'https://api.liteapi.travel/v3.0';

const parseResponseBody = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { raw: text }; }
};

const toDate = (value) => {
  if (!value) return null;
  const normalised = String(value).trim().replace(' ', 'T');
  const date = new Date(/(Z|[+-]\d{2}:?\d{2})$/.test(normalised) ? normalised : `${normalised}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

// The free-cancellation window closes at the EARLIEST cancelTime: each entry is the
// penalty that applies from that moment on, not a deadline that is still free.
export function freeCancellationDeadline(cancellationPolicies) {
  if (!cancellationPolicies) return null;
  if (cancellationPolicies.refundableTag !== 'RFN') return null;
  const infos = cancellationPolicies.cancelPolicyInfos ?? [];
  const times = infos.map((info) => toDate(info.cancelTime)).filter(Boolean);
  if (times.length === 0) return null;
  return new Date(Math.min(...times.map((t) => t.getTime())));
}

// A prebook carries its policy per rate, not at the top level, and those terms can
// differ from the ones search advertised. The strictest rate governs the booking.
export function prebookCancellation(prebook) {
  const rates = (prebook?.roomTypes ?? []).flatMap((roomType) => roomType.rates ?? []);
  const terms = strictestCancellation(rates.map((rate) => rate.cancellationPolicies));
  return { ...terms, changed: Boolean(prebook?.cancellationChanged) };
}

export function bookingFreeCancellationUntil(booking) {
  const explicit = toDate(booking?.lastFreeCancellationDate);
  if (explicit) return explicit;
  return freeCancellationDeadline(booking?.cancellationPolicies);
}

// An offer is one bookable unit but can carry several rates, and the supplier applies
// the worst of them. Judging it by its first rate is how a non-refundable room reaches
// a customer. Search and booking both go through this so they cannot disagree.
export function strictestCancellation(policies = []) {
  const list = policies.filter(Boolean);
  if (list.length === 0) return { refundableTag: null, freeCancellationUntil: null, policies: [] };
  const allRefundable = list.every((p) => p.refundableTag === 'RFN');
  const deadlines = list.map(freeCancellationDeadline).filter(Boolean);
  return {
    refundableTag: allRefundable ? 'RFN' : 'NRFN',
    freeCancellationUntil: deadlines.length ? new Date(Math.min(...deadlines.map((d) => d.getTime()))) : null,
    policies: list,
  };
}

// A missing deadline is treated as unacceptable rather than unlimited: an RFN rate with
// no stated window is missing data, and guessing in our favour is what costs a room.
export function isCancellationAcceptable(terms, { at = new Date(), marginMs = 0 } = {}) {
  if (terms?.refundableTag !== 'RFN') return false;
  if (!terms.freeCancellationUntil) return false;
  return at.getTime() + marginMs < terms.freeCancellationUntil.getTime();
}

export function isFreelyCancellable(cancellationPolicies, options = {}) {
  return isCancellationAcceptable(strictestCancellation([cancellationPolicies]), options);
}

export function createLiteApiClient({ apiKey, baseUrl = LITEAPI_URL, logger, fetchImpl = fetch } = {}) {
  if (!apiKey) throw new Error('createLiteApiClient requires an apiKey');

  const request = async (action, path, { method = 'GET', body } = {}) => {
    const res = await fetchImpl(`${baseUrl}${path}`, {
      method,
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const payload = await parseResponseBody(res);
    if (!res.ok || payload?.error) {
      const detail = payload?.error ?? {};
      logger?.warn('LiteAPI request failed', { action, statusCode: res.status, code: detail.code, message: detail.message });
      const error = new Error(`LiteAPI ${action} failed: ${detail.message ?? res.status}`);
      // LiteAPI returns some failures with a 200, so never let a 2xx through as the error's status.
      error.statusCode = res.ok ? 502 : res.status;
      error.code = detail.code;
      error.detail = detail;
      throw error;
    }
    return payload;
  };

  const searchRates = async ({ hotelIds, cityName, countryCode, checkin, checkout, occupancies, currency, guestNationality }) => {
    const payload = await request('searchRates', '/hotels/rates', {
      method: 'POST',
      body: {
        ...(hotelIds ? { hotelIds } : { cityName, countryCode }),
        checkin,
        checkout,
        occupancies,
        currency,
        guestNationality,
      },
    });
    return payload?.data ?? [];
  };

  // Rates are only returned for an explicit list of hotel ids on this account: searching
  // by city, coordinates or IATA code comes back empty even where inventory exists. So a
  // city search resolves to hotel ids first, then asks for their rates.
  const getCountries = async () => {
    const payload = await request('getCountries', '/data/countries');
    return payload?.data ?? [];
  };

  const searchHotels = async ({ cityName, countryCode, limit = 50 }) => {
    const query = new URLSearchParams({ countryCode, cityName, limit: String(limit) });
    const payload = await request('searchHotels', `/data/hotels?${query}`);
    return payload?.data ?? [];
  };

  const hotelSnapshot = (hotel) => ({
    name: hotel.name,
    address: hotel.address,
    city: hotel.city,
    country: hotel.country,
    stars: hotel.stars,
  });

  const refundableOffers = async (params, { marginMs = 0, hotelLimit = 50 } = {}) => {
    let searchParams = params;
    let directory = new Map();

    if (!params.hotelIds && params.cityName && params.countryCode) {
      const listed = await searchHotels({
        cityName: params.cityName,
        countryCode: params.countryCode,
        limit: hotelLimit,
      });
      if (listed.length === 0) return [];
      directory = new Map(listed.map((h) => [h.id, h]));
      const { cityName, countryCode, ...rest } = params;
      searchParams = { ...rest, hotelIds: listed.map((h) => h.id) };
    }

    const hotels = await searchRates(searchParams);
    return hotels.flatMap((hotel) =>
      (hotel.roomTypes ?? [])
        .map((roomType) => ({
          hotel,
          roomType,
          rate: roomType.rates?.[0],
          terms: strictestCancellation((roomType.rates ?? []).map((r) => r.cancellationPolicies)),
        }))
        .filter(({ terms }) => isCancellationAcceptable(terms, { marginMs }))
        .map(({ hotel: h, roomType, rate, terms }) => {
          const listing = directory.get(h.hotelId);
          return {
            hotelId: h.hotelId,
            offerId: roomType.offerId,
            hotel: listing ? hotelSnapshot(listing) : undefined,
            roomName: rate?.name,
            boardName: rate?.boardName,
            price: roomType.offerRetailRate,
            freeCancellationUntil: terms.freeCancellationUntil,
            cancellationPolicies: terms.policies,
          };
        }),
    );
  };

  const prebook = async ({ offerId, usePaymentSdk = false }) => {
    const payload = await request('prebook', '/rates/prebook', { method: 'POST', body: { offerId, usePaymentSdk } });
    return payload?.data ?? null;
  };

  const book = async ({ prebookId, holder, guests, payment = { method: 'ACC_CREDIT_CARD' }, clientReference }) => {
    const payload = await request('book', '/rates/book', {
      method: 'POST',
      body: { prebookId, holder, guests, payment, ...(clientReference ? { clientReference } : {}) },
    });
    return payload?.data ?? null;
  };

  const getBooking = async (bookingId) => {
    const payload = await request('getBooking', `/bookings/${encodeURIComponent(bookingId)}`);
    return payload?.data ?? null;
  };

  // The cancel response uses snake_case where the rest of the API uses camelCase.
  const cancelBooking = async (bookingId) => {
    const payload = await request('cancelBooking', `/bookings/${encodeURIComponent(bookingId)}`, { method: 'PUT' });
    const data = payload?.data ?? {};
    return {
      bookingId: data.bookingId ?? bookingId,
      status: data.status ?? null,
      cancellationFee: data.cancellation_fee ?? data.cancellationFee ?? null,
      refundAmount: data.refund_amount ?? data.refundAmount ?? null,
      currency: data.currency ?? null,
      sandbox: Boolean(payload?.sandbox),
    };
  };

  return {
    searchRates,
    searchHotels,
    getCountries,
    refundableOffers,
    prebook,
    book,
    getBooking,
    cancelBooking,
    freeCancellationDeadline,
    isFreelyCancellable,
    isCancellationAcceptable,
    strictestCancellation,
    prebookCancellation,
    bookingFreeCancellationUntil,
  };
}
