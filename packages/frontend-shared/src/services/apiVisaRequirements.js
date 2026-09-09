import { apiFetchPublic, apiFetch } from './apiClient.js';

const URL = `/api/visa-requirements`;

export async function checkVisaRequirementApi({ nationality, residence, destination }) {
  const params = new URLSearchParams({ nationality, destination });
  if (residence) params.append('residence', residence);
  return apiFetchPublic(`${URL}/check?${params.toString()}`, { cache: 'no-store' });
}

/** Public: only the destinations that have a published rule behind them. */
export async function getVisaDestinationsApi() {
  return apiFetchPublic(`${URL}/destinations`);
}

/** Public: one published rule with its outcome groups, for a destination page. */
export async function getPublicVisaRuleApi(destination) {
  return apiFetchPublic(`${URL}/public/${encodeURIComponent(destination)}`, {
    next: { revalidate: 3600 },
  });
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
