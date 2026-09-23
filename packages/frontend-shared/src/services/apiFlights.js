import { apiFetch, apiUpload } from './apiClient.js';

const URL = '/api/flights';

export async function getFlightsApi(formData) {
  return await apiFetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });
}

export async function getAirlinesApi() {
  return await apiFetch(`${URL}/airlines`);
}

export async function updateAirlineLogoApi({ iataCode, file }) {
  const formData = new FormData();
  formData.append('logo', file);
  return await apiUpload(`${URL}/airlines/${iataCode}/logo`, formData, 'PATCH');
}

export async function deleteAirlineLogoApi(iataCode) {
  return await apiFetch(`${URL}/airlines/${iataCode}/logo`, { method: 'DELETE' });
}
