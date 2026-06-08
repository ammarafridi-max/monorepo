import { apiFetch } from './apiClient.js';

const URL = '/api/bookings';

export async function getBookingsApi(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== ''),
  ).toString();
  return await apiFetch(query ? `${URL}?${query}` : URL);
}

export async function getBookingApi(id) {
  return await apiFetch(`${URL}/${id}`);
}

export async function updateBookingApi(id, bookingData) {
  return await apiFetch(`${URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  });
}

export async function deleteBookingApi(id) {
  return await apiFetch(`${URL}/${id}`, {
    method: 'DELETE',
  });
}

export async function refundBookingApi(transactionId) {
  return await apiFetch(`${URL}/${transactionId}/refund`, {
    method: 'POST',
  });
}
