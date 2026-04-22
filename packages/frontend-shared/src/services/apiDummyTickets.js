import { apiFetch } from './apiClient.js';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

const URL = '/api/tickets';

export async function getDummyTicketsApi(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  // Use raw fetch here — apiFetch only returns json.data, but we also need
  // json.pagination and json.results from this paginated list endpoint.
  const res = await fetch(`${BACKEND}${URL}?${queryString}`, { credentials: 'include' });
  if (!res.ok) {
    let message = 'Failed to fetch tickets';
    try {
      const json = await res.json();
      message = json.message || json.error || message;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  const json = await res.json();
  return {
    data: json.data,
    pagination: json.pagination,
    results: json.results,
  };
}

export async function getDummyTicketApi(sessionId) {
  const result = await apiFetch(`${URL}/${sessionId}`);
  return result;
}

export async function updateDummyTicketApi({ sessionId, orderStatus }) {
  const result = await apiFetch(`${URL}/${sessionId}/order-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderStatus }),
  });

  return result;
}

export async function deleteDummyTicketApi(sessionId) {
  await apiFetch(`${URL}/${sessionId}`, {
    method: 'DELETE',
  });

  return true;
}

export async function refundDummyTicketApi(transactionId) {
  const result = await apiFetch(`${URL}/refund/${transactionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  return result;
}

export async function getStripePaymentURL(ticketData) {
  const sessionId = localStorage.getItem('SESSION_ID');

  if (!sessionId) {
    throw new Error('Session ID is missing. Please restart the process.');
  }

  return await apiFetch(`${URL}/checkout`, {
    method: 'POST',
    body: JSON.stringify(ticketData),
    headers: { 'X-Session-ID': sessionId, 'Content-Type': 'application/json' },
  });
}

export async function createDummyTicketApi(data) {
  return await apiFetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
