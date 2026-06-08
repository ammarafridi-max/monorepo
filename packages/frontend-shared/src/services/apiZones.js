import { apiFetch } from './apiClient.js';

const URL = '/api/zones';

export async function getZonesApi() {
  return await apiFetch(URL);
}

export async function getZoneApi(id) {
  const data = await apiFetch(`${URL}/${id}`);
  return data?.zone || null;
}

export async function createZoneApi(zoneData) {
  const data = await apiFetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(zoneData),
  });
  return data?.zone || null;
}

export async function updateZoneApi(id, zoneData) {
  const data = await apiFetch(`${URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(zoneData),
  });
  return data?.zone || null;
}

export async function deleteZoneApi(id) {
  return await apiFetch(`${URL}/${id}`, {
    method: 'DELETE',
  });
}

export async function duplicateZoneApi(id) {
  const data = await apiFetch(`${URL}/${id}/duplicate`, {
    method: 'POST',
  });
  return data?.zone || null;
}
