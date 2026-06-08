import { apiFetch } from './apiClient.js';

const URL = '/api/pricing-rules';

export async function getPricingRulesApi(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) query.append(key, value);
  });

  const qs = query.toString();
  return await apiFetch(qs ? `${URL}?${qs}` : URL);
}

export async function getPricingRuleApi(id) {
  return await apiFetch(`${URL}/${id}`);
}

export async function createPricingRuleApi(pricingRuleData) {
  return await apiFetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pricingRuleData),
  });
}

export async function updatePricingRuleApi(id, pricingRuleData) {
  return await apiFetch(`${URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pricingRuleData),
  });
}

export async function deletePricingRuleApi(id) {
  return await apiFetch(`${URL}/${id}`, {
    method: 'DELETE',
  });
}

export async function duplicatePricingRuleApi(id) {
  return await apiFetch(`${URL}/${id}/duplicate`, {
    method: 'POST',
  });
}
