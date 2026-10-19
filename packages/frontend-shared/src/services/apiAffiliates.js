import { apiFetch } from './apiClient.js';

const URL = '/api/affiliates';

export function recordAffiliateClickApi(affiliateId) {
  if (typeof window === 'undefined') return;
  if (!/^\d{9}$/.test(String(affiliateId ?? ''))) return;

  try {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${URL}/clicks/${affiliateId}`, {
      method: 'POST',
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export async function getAffiliatesApi(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const result = await apiFetch(`${URL}?${queryString}`);

  return {
    affiliates: result?.affiliates || [],
    pagination: result?.pagination || null,
  };
}

export async function getAffiliateApi(id) {
  return await apiFetch(`${URL}/${id}`);
}

export async function createAffiliateApi(payload) {
  return await apiFetch(`${URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function updateAffiliateApi(id, payload) {
  return await apiFetch(`${URL}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteAffiliateApi(id) {
  return await apiFetch(`${URL}/${id}`, {
    method: 'DELETE',
  });
}

export async function getAffiliateStatsApi(id, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return await apiFetch(`${URL}/${id}/stats${queryString ? `?${queryString}` : ''}`);
}

export async function getAffiliateTicketsApi(id, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return await apiFetch(`${URL}/${id}/tickets?${queryString}`);
}

export async function getAffiliateApplicationsApi(id, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return await apiFetch(`${URL}/${id}/applications?${queryString}`);
}

export async function getAffiliatePayoutsApi(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
  const queryString = new URLSearchParams(clean).toString();
  const result = await apiFetch(`${URL}/payouts${queryString ? `?${queryString}` : ''}`);

  return {
    payouts: result?.payouts || [],
    pagination: result?.pagination || null,
  };
}

export async function getAffiliatePayoutApi(id) {
  return await apiFetch(`${URL}/payouts/${id}`);
}

export async function generateAffiliatePayoutsApi(payload) {
  return await apiFetch(`${URL}/payouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function markAffiliatePayoutPaidApi(id, payload) {
  return await apiFetch(`${URL}/payouts/${id}/paid`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function voidAffiliatePayoutApi(id) {
  return await apiFetch(`${URL}/payouts/${id}/void`, {
    method: 'PATCH',
  });
}
