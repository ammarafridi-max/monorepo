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

// --- Order actions (admin role only) ---
export function refundOrder(id) {
  return adminFetch(`/admin/orders/${id}/refund`, { method: 'POST' });
}
export function retryOrder(id) {
  return adminFetch(`/admin/orders/${id}/retry`, { method: 'POST' });
}
export function resendOrderEmail(id) {
  return adminFetch(`/admin/orders/${id}/resend-email`, { method: 'POST' });
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

// --- Admin-user management (admin role only) ---
export function getAdminUsers(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const qs = new URLSearchParams(clean).toString();
  return adminFetch(`/admin-users${qs ? `?${qs}` : ''}`);
}
export function createAdminUser(data) {
  return adminFetch('/admin-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
export function updateAdminUser(username, data) {
  return adminFetch(`/admin-users/${username}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
export function deleteAdminUser(username) {
  return adminFetch(`/admin-users/${username}`, { method: 'DELETE' });
}
export function setAdminUserPassword(username, password, passwordConfirm) {
  return adminFetch(`/admin-users/${username}/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, passwordConfirm }),
  });
}

// --- Own account (any admin, via the /auth routes) ---
export function updateMyProfile(data) {
  return adminFetch('/auth/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
export function updateMyPassword({ passwordCurrent, password, passwordConfirm }) {
  return adminFetch('/auth/update-password', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passwordCurrent, password, passwordConfirm }),
  });
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
