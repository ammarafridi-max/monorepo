import { apiFetch, apiUpload } from './apiClient.js';

const URL = '/api/vehicles';

export async function getAllVehiclesApi() {
  return await apiFetch(URL);
}

export async function getVehicleApi(id) {
  return await apiFetch(`${URL}/${id}`);
}

export async function createVehicleApi(formData) {
  return await apiUpload(URL, formData, 'POST');
}

export async function updateVehicleApi({ id, formData }) {
  return await apiUpload(`${URL}/${id}`, formData, 'PATCH');
}

export async function deleteVehicleApi(id) {
  return await apiFetch(`${URL}/${id}`, {
    method: 'DELETE',
  });
}

export async function duplicateVehicleApi(id) {
  return await apiFetch(`${URL}/${id}/duplicate`, {
    method: 'POST',
  });
}

export async function deleteVehicleImageApi(id, imageUrl) {
  return await apiFetch(`${URL}/${id}/images`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  });
}
