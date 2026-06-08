import { apiFetch } from './apiClient';

const URL = '/api/availability-rules';

export async function getAllAvailabilityRulesApi() {
  return await apiFetch(URL);
}

export async function getAvailabilityRuleApi(id) {
  return await apiFetch(`${URL}/${id}`);
}

export async function createAvailabilityRuleApi(data) {
  return await apiFetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateAvailabilityRuleApi({ id, data }) {
  return await apiFetch(`${URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteAvailabilityRuleApi(id) {
  await apiFetch(`${URL}/${id}`, { method: 'DELETE' });
}

export async function duplicateAvailabilityRuleApi(id) {
  return await apiFetch(`${URL}/${id}/duplicate`, {
    method: 'POST',
  });
}
