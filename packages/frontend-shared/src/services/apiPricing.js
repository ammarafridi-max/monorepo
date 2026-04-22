import { apiFetch } from './apiClient.js';

const URL = '/api/pricing';

export async function getDummyTicketPricingApi() {
  return await apiFetch(`${URL}/dummy-ticket`);
}

export async function getAdminDummyTicketPricingApi() {
  return await apiFetch(`${URL}/dummy-ticket/admin`);
}

export async function updateAdminDummyTicketPricingApi(payload) {
  return await apiFetch(`${URL}/dummy-ticket/admin`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
