import { apiFetch } from './apiClient';

const URL = `/api/bookings`;

export async function getBookingsApi() {
  return await apiFetch(URL);
}

export async function getBookingApi(id) {
  return await apiFetch(`${URL}/${id}`);
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

export async function getAvailableVehiclesApi(params) {
  const query = new URLSearchParams(params).toString();
  return await apiFetch(`${URL}/available-vehicles?${query}`);
}

export async function createBookingApi(bookingData) {
  return await apiFetch(`${URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookingData),
  });
}

export async function getPaymentLinkApi(id) {
  return await apiFetch(`${URL}/${id}/payment-link`, {
    method: 'POST',
  });
}
