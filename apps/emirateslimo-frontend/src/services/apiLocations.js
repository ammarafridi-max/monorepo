import { apiFetch } from './apiClient';

const URL = `/api/locations`;

export async function getLocationsApi(query) {
  return await apiFetch(`${URL}?query=${query}`);
}

export async function getLatLngApi(query, id) {
  const { lat, lng } = await apiFetch(`${URL}/coordinates?query=${query}&id=${id}`);
  return { lat, lng };
}

export async function getDistanceApi({ originLat, originLng, destLat, destLng }) {
  return await apiFetch(
    `${URL}/distance?originLat=${originLat}&originLng=${originLng}&destLat=${destLat}&destLng=${destLng}`,
  );
}

export async function getUserLocationByIpApi() {
  return await apiFetch(`${URL}/user-location`);
}
