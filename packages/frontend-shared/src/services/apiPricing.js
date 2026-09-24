import { apiFetch, apiFetchPublic } from './apiClient.js';

const URL = '/api/pricing';

const withCurrency = (path, currency) =>
  currency ? `${path}?currency=${encodeURIComponent(currency)}` : path;

export async function getDummyTicketPricingApi(currency) {
  return await apiFetch(withCurrency(`${URL}/dummy-ticket`, currency));
}

export async function getAdminDummyTicketPricingApi(currency) {
  return await apiFetch(withCurrency(`${URL}/dummy-ticket/admin`, currency));
}

export async function getAdminDummyTicketPriceBooksApi() {
  return await apiFetch(`${URL}/dummy-ticket/admin/books`);
}

export async function updateAdminDummyTicketPricingApi(payload) {
  return await apiFetch(`${URL}/dummy-ticket/admin`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminDummyTicketPricingApi(currency) {
  return await apiFetch(withCurrency(`${URL}/dummy-ticket/admin`, currency), {
    method: 'DELETE',
  });
}

// Server components need the public client: apiFetch sends credentials, which
// is a browser concept, and carries no timeout.
export async function getDummyTicketPricingServerApi(currency, { revalidate = 300 } = {}) {
  return await apiFetchPublic(withCurrency(`${URL}/dummy-ticket`, currency), {
    next: { revalidate },
  });
}
