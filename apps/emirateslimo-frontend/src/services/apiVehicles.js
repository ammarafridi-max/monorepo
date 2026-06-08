import { apiFetch, apiUpload } from './apiClient';

const URL = `/api/vehicles`;

export function getAllVehiclesApi() {
  return apiFetch(URL);
}

export function getVehicleApi(id) {
  return apiFetch(`${URL}/${id}`);
}

export function createVehicleApi(formData) {
  return apiUpload(URL, formData, 'POST');
}

export function updateVehicleApi({ id, formData }) {
  return apiUpload(`${URL}/${id}`, formData, 'PATCH');
}

export function deleteVehicleApi(id) {
  return apiFetch(`${URL}/${id}`, { method: 'DELETE' });
}

export function duplicateVehicleApi(id) {
  return apiFetch(`${URL}/${id}/duplicate`, { method: 'POST' });
}

export function deleteVehicleImageApi(id, imageUrl) {
  return apiFetch(`${URL}/${id}/images`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  });
}
