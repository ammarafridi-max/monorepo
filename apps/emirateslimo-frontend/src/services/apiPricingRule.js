import { apiFetch } from './apiClient';

const URL = `/api/pricing-rules`;

export async function getAllPricingRulesApi(filters) {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) query.append(key, value);
  });

  return await apiFetch(`${URL}?${query?.toString()}`);
}

export async function getPricingRuleApi(id) {
  return await apiFetch(`${URL}/${id}`);
}

export async function createPricingRuleApi(formData) {
  return await apiFetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });
}

export async function updatePricingRuleApi({ id, data }) {
  return await apiFetch(`${URL}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function deletePricingRuleApi(id) {
  await apiFetch(`${URL}/${id}`, {
    method: 'DELETE',
  });

  return true;
}

export async function duplicatePricingRuleApi(id) {
  return await apiFetch(`${URL}/${id}/duplicate`, {
    method: 'POST',
  });
}
