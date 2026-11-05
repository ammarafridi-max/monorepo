import { apiFetch, apiFetchPublic, csrfHeader } from './apiClient.js';
import { getAttribution } from '../utils/attribution.js';

const URL = '/api/hotel-bookings';

export async function searchHotelsApi(payload) {
  return await apiFetchPublic(`${URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    timeoutMs: 45000,
  });
}

export async function createHotelBookingApi(payload) {
  return await apiFetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, attribution: getAttribution() }),
  });
}

export async function createHotelCheckoutApi({ sessionId, currencyCode }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${URL}/checkout`, {
    method: 'POST',
    headers: { ...csrfHeader('POST'), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ sessionId, currencyCode }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to start checkout');
  return json.url;
}

export async function getHotelBookingApi(sessionId) {
  return await apiFetch(`${URL}/${sessionId}`);
}

export async function getHotelBookingsApi(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null),
  ).toString();
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${URL}?${query}`, {
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch reservations');
  const limit = json.limit || 25;
  return {
    data: json.data,
    pagination: {
      total: json.total ?? 0,
      page: json.page ?? 1,
      limit,
      totalPages: Math.max(1, Math.ceil((json.total ?? 0) / limit)),
    },
  };
}

export async function updateHotelBookingStatusApi({ sessionId, orderStatus }) {
  return await apiFetch(`${URL}/${sessionId}/order-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderStatus }),
  });
}

export async function deleteHotelBookingApi(sessionId) {
  return await apiFetch(`${URL}/${sessionId}`, { method: 'DELETE' });
}

export async function getHotelPricingApi(currency) {
  const query = currency ? `?currency=${encodeURIComponent(currency)}` : '';
  return await apiFetchPublic(`${URL}/pricing${query}`);
}

export async function suggestHotelCitiesApi(search, { signal } = {}) {
  return await apiFetchPublic(`${URL}/cities?search=${encodeURIComponent(search)}`, { signal });
}

export async function sendHotelReservationApi({ sessionId, subject, body, bodyHtml, file }) {
  const fd = new FormData();
  fd.append('subject', subject);
  fd.append('body', body);
  if (bodyHtml) fd.append('bodyHtml', bodyHtml);
  fd.append('file', file);
  return await apiFetch(`${URL}/${sessionId}/send-reservation`, { method: 'POST', body: fd });
}
