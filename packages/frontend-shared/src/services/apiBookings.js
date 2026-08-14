import { apiFetch, apiFetchPublic } from './apiClient.js';

const BASE = '/api/bookings';

export async function createBookingApi({ trip, vehicle, passenger }) {
  return await apiFetchPublic(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trip, vehicle, passenger }),
  });
}

// `credentials: include` is what lets an admin see the unredacted booking; anonymous callers send no cookie.
export async function getBookingApi(id) {
  return await apiFetchPublic(`${BASE}/${id}`, { credentials: 'include' });
}

export async function getBookingBySessionIdApi(sessionId) {
  return await apiFetchPublic(`${BASE}/by-session/${sessionId}`, { credentials: 'include' });
}

export async function createBookingCheckoutApi({ vehicle, passenger, bookingId, successUrl, cancelUrl }) {
  return await apiFetchPublic(`${BASE}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicle, passenger, bookingId, successUrl, cancelUrl }),
  });
}

export async function listBookingsApi({ page = 1, limit = 20, status } = {}) {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) qs.set('status', status);
  return await apiFetch(`${BASE}?${qs}`);
}

export async function updateBookingStatusApi(id, status) {
  return await apiFetch(`${BASE}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}
