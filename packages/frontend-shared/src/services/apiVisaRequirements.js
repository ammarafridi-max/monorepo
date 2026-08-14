import { apiFetchPublic, apiFetch } from './apiClient.js';

const URL = `/api/visa-requirements`;

export async function checkVisaRequirementApi({ nationality, residence, destination }) {
  const params = new URLSearchParams({ nationality, destination });
  if (residence) params.append('residence', residence);
  return apiFetchPublic(`${URL}/check?${params.toString()}`, { cache: 'no-store' });
}

export const getVisaRulesApi = (opts = {}) => {
  const params = new URLSearchParams();
  if (opts.published !== undefined) params.append('published', String(opts.published));
  const qs = params.toString();
  return apiFetch(`${URL}/rules${qs ? `?${qs}` : ''}`);
};
export const getVisaRuleApi = (destination) => apiFetch(`${URL}/rules/${destination}`);
export const upsertVisaRuleApi = (payload) =>
  apiFetch(`${URL}/rules`, { method: 'POST', body: JSON.stringify(payload) });
export const deleteVisaRuleApi = (destination) =>
  apiFetch(`${URL}/rules/${destination}`, { method: 'DELETE' });
export const getVisaQueryStatsApi = (days = 30) => apiFetch(`${URL}/stats?days=${days}`);
