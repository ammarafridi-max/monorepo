import { apiFetch } from './apiClient.js';

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
