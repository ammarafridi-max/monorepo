import { apiFetch } from './apiClient.js';

const URL = '/api/payments/admin';

// -- Revenue dashboard -------------------------------------------------------

export async function getRevenueApi({ from, to }) {
  const qs = new URLSearchParams({ from: String(from), to: String(to) }).toString();
  return apiFetch(`${URL}/revenue?${qs}`);
}

export async function listChargesApi({ from, to, limit = 25, startingAfter } = {}) {
  const params = new URLSearchParams();
  if (from) params.set('from', String(from));
  if (to) params.set('to', String(to));
  if (limit) params.set('limit', String(limit));
  if (startingAfter) params.set('startingAfter', startingAfter);
  return apiFetch(`${URL}/charges?${params.toString()}`);
}

// -- Payment links -----------------------------------------------------------

export async function createPaymentLinkApi(payload) {
  return apiFetch(`${URL}/payment-links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function listPaymentLinksApi({ status, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('page', String(page));
  params.set('limit', String(limit));
  return apiFetch(`${URL}/payment-links?${params.toString()}`);
}

export async function getPaymentLinkApi(id) {
  return apiFetch(`${URL}/payment-links/${id}`);
}

export async function updatePaymentLinkActiveApi(id, active) {
  return apiFetch(`${URL}/payment-links/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active }),
  });
}
