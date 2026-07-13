// Admin API client. Talks to the Express api's /auth and /admin routes with the
// httpOnly admin cookie (picturesk_admin) as the credential: every call sends
// credentials:'include', nothing is stored in JS. The api returns a { status, data }
// envelope; we unwrap `data`. Errors throw Error(message) with .status attached so
// callers can distinguish a 401 (not logged in) from other failures.
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

// --- Auth ---
export function adminLogin(credentials) {
  return adminFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
}
export function adminLogout() {
  return adminFetch('/auth/logout', { method: 'POST' });
}
export function getAdminMe() {
  return adminFetch('/auth/me');
}

// --- Data (read-only) ---
export function getAdminOrders(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const qs = new URLSearchParams(clean).toString();
  return adminFetch(`/admin/orders${qs ? `?${qs}` : ''}`);
}
export function getAdminOrder(id) {
  return adminFetch(`/admin/orders/${id}`);
}
export function getAdminStats() {
  return adminFetch('/admin/stats');
}
export function getAdminCustomers(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const qs = new URLSearchParams(clean).toString();
  return adminFetch(`/admin/customers${qs ? `?${qs}` : ''}`);
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
