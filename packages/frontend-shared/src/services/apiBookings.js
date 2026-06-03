import { apiFetchPublic } from './apiClient.js';

const BASE = '/api/bookings';

export async function createBookingApi({ trip, vehicle, passenger }) {
  return await apiFetchPublic(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trip, vehicle, passenger }),
  });
}

export async function getBookingApi(id) {
  return await apiFetchPublic(`${BASE}/${id}`);
}
