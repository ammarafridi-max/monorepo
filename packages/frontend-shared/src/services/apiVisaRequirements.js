import { apiFetchPublic } from './apiClient.js';

const URL = `/api/visa-requirements`;

export async function checkVisaRequirementApi({ nationality, residence, destination }) {
  const params = new URLSearchParams({ nationality, destination });
  if (residence) params.append('residence', residence);
  return apiFetchPublic(`${URL}/check?${params.toString()}`, { cache: 'no-store' });
}

export async function getVisaDestinationsApi() {
  return apiFetchPublic(`${URL}/destinations`);
}

export async function getPublicVisaRuleApi(destination) {
  return apiFetchPublic(`${URL}/public/${encodeURIComponent(destination)}`, {
    next: { revalidate: 3600 },
  });
}
