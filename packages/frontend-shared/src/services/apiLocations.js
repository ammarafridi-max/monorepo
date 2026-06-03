import { apiFetchPublic } from './apiClient.js';

const BASE = '/api/locations';

export async function getLocationSuggestionsApi(query) {
  return await apiFetchPublic(`${BASE}?query=${encodeURIComponent(query)}`);
}

export async function getCoordinatesApi(query, id) {
  const params = new URLSearchParams({ query });
  if (id) params.set('id', id);
  return await apiFetchPublic(`${BASE}/coordinates?${params}`);
}

export async function getDistanceApi({ originLat, originLng, destLat, destLng }) {
  const params = new URLSearchParams({
    originLat: String(originLat),
    originLng: String(originLng),
    destLat:   String(destLat),
    destLng:   String(destLng),
  });
  return await apiFetchPublic(`${BASE}/distance?${params}`);
}

export async function getUserLocationApi() {
  return await apiFetchPublic(`${BASE}/user-location`);
}
