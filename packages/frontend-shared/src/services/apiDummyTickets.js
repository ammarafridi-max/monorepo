import { apiFetch } from './apiClient.js';
import { getAttribution } from '../utils/attribution.js';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

const URL = '/api/tickets';

export async function getDummyTicketsApi(params = {}) {
  const queryString = new URLSearchParams(params).toString();

  const res = await fetch(`${BACKEND}${URL}?${queryString}`, { credentials: 'include' });
  if (!res.ok) {
    let message = 'Failed to fetch tickets';
    try {
      const json = await res.json();
      message = json.message || json.error || message;
    } catch {  }
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

export async function getTicketQuoteApi(sessionId, currency) {
  const query = currency ? `?currency=${encodeURIComponent(currency)}` : '';
  return await apiFetch(`${URL}/${sessionId}/quote${query}`);
}

export async function getDummyTicketStatsApi(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  const queryString = query.toString();
  return await apiFetch(`${URL}/stats${queryString ? `?${queryString}` : ''}`);
}

export async function getLatestPaidTicketApi() {
  return await apiFetch(`${URL}/latest-paid`);
}

export async function sendReservationApi({ sessionId, subject, body, bodyHtml, file }) {
  const fd = new FormData();
  fd.append('subject', subject);
  fd.append('body', body);
  if (bodyHtml) fd.append('bodyHtml', bodyHtml);
  fd.append('file', file);
  return await apiFetch(`${URL}/${sessionId}/send-reservation`, {
    method: 'POST',
    body: fd,
  });
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

export async function updateDeliveryDateApi({ sessionId, deliveryDate, immediate }) {
  const result = await apiFetch(`${URL}/${sessionId}/delivery`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(immediate ? { immediate: true } : { deliveryDate }),
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
    body: JSON.stringify({ ...data, attribution: getAttribution() }),
  });
}

export async function createPayPalOrderApi({ sessionId, currencyCode }) {
  return await apiFetch(`${URL}/paypal/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, currencyCode }),
  });
}

export async function capturePayPalOrderApi({ sessionId, orderId }) {
  return await apiFetch(`${URL}/paypal/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, orderId }),
  });
}
