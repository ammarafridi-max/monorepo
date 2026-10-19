import { csrfHeader } from '@travel-suite/frontend-shared/services/apiClient';
import { API_BASE } from './api';

async function adminFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...csrfHeader(options.method ?? 'GET'), ...(options.headers || {}) },
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

export function refundOrder(id) {
  return adminFetch(`/api/admin/orders/${id}/refund`, { method: 'POST' });
}
export function retryOrder(id) {
  return adminFetch(`/api/admin/orders/${id}/retry`, { method: 'POST' });
}
export function resendOrderEmail(id) {
  return adminFetch(`/api/admin/orders/${id}/resend-email`, { method: 'POST' });
}
export function bulkDeleteOrders(ids) {
  return adminFetch("/api/admin/orders/bulk-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
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

export function usd(cents) {
  if (cents == null) return '-';
  return `$${(cents / 100).toFixed(2)}`;
}
export function dateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  const date = d.toISOString().slice(0, 10);
  const time = d.toISOString().slice(11, 16);
  return `${date}, ${time}`;
}
export function dateOnly(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '-';
}
export const STATUS_LABEL = {
  AWAITING_PAYMENT: 'Awaiting payment',
  PAID: 'Paid',
  TRAINING: 'Training',
  GENERATING: 'Generating',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
};
