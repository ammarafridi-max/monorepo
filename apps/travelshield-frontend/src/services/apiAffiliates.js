import { apiFetch } from './apiClient';

const URL = '/api/affiliates';

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

export async function seedAffiliatesApi() {
  return await apiFetch(`${URL}/seed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function getAffiliateStatsApi(id, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return await apiFetch(`${URL}/${id}/stats${queryString ? `?${queryString}` : ''}`);
}

export async function getAffiliateTicketsApi(id, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return await apiFetch(`${URL}/${id}/applications${queryString ? `?${queryString}` : ''}`);
}
