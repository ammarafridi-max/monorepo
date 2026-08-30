// Picturesk-specific admin data + order actions. Auth, staff CRUD, and the admin
// shell come from @travel-suite/frontend-shared, which talks to the same api under
// /api via NEXT_PUBLIC_BACKEND_URL; this module covers the orders/stats/customers
// surface that is Picturesk's own.
//
// The httpOnly admin cookie (`jwt`, set by the api) is the credential: every call
// sends credentials:'include' and nothing is stored in JS. The api returns a
// { status, data } envelope; we unwrap `data`. Errors throw Error(message) with
// .status attached so callers can tell a 401 from other failures.
import { API_BASE } from './api';

async function adminFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...(options.headers || {}) },
    credentials: 'include',
  });
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.message || body.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body.data ?? null;
}

// --- Data (read-only) ---
export function getAdminOrders(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const qs = new URLSearchParams(clean).toString();
  return adminFetch(`/api/admin/orders${qs ? `?${qs}` : ''}`);
}
export function getAdminOrder(id) {
  return adminFetch(`/api/admin/orders/${id}`);
}

// --- Order actions (admin role only) ---
export function refundOrder(id) {
  return adminFetch(`/api/admin/orders/${id}/refund`, { method: 'POST' });
}
export function retryOrder(id) {
  return adminFetch(`/api/admin/orders/${id}/retry`, { method: 'POST' });
}
export function resendOrderEmail(id) {
  return adminFetch(`/api/admin/orders/${id}/resend-email`, { method: 'POST' });
}
export function deleteOrder(id) {
  return adminFetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
}
export function getAdminStats() {
  return adminFetch('/api/admin/stats');
}
export function getAdminCustomers(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const qs = new URLSearchParams(clean).toString();
  return adminFetch(`/api/admin/customers${qs ? `?${qs}` : ''}`);
}

// --- Display helpers ---
/** Integer cents -> "$35.00". Null/undefined -> "-". */
export function usd(cents) {
  if (cents == null) return '-';
  return `$${(cents / 100).toFixed(2)}`;
}
/** ISO date -> "2026-07-13, 14:32". Null -> "-". */
export function dateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  const date = d.toISOString().slice(0, 10);
  const time = d.toISOString().slice(11, 16);
  return `${date}, ${time}`;
}
/** ISO date -> "2026-07-13". Null -> "-". */
export function dateOnly(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '-';
}
/** Human status label, brand voice (no jargon, no em dashes). */
export const STATUS_LABEL = {
  AWAITING_PAYMENT: 'Awaiting payment',
  PAID: 'Paid',
  TRAINING: 'Training',
  GENERATING: 'Generating',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
};
