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

export async function updateAirlineApi({ iataCode, isVisible, ticketValidities }) {
  return await apiFetch(`${URL}/airlines/${iataCode}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...(isVisible === undefined ? {} : { isVisible }),
      ...(ticketValidities === undefined ? {} : { ticketValidities }),
    }),
  });
}

export async function updateAirlineLogoApi({ iataCode, file }) {
  const formData = new FormData();
  formData.append('logo', file);
  return await apiUpload(`${URL}/airlines/${iataCode}/logo`, formData, 'PATCH');
}

export async function adoptAirlineLogoApi({ iataCode, url }) {
  return await apiFetch(`${URL}/airlines/${iataCode}/logo/from-candidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
}

export async function adoptHighConfidenceLogosApi({ dryRun = false } = {}) {
  return await apiFetch(`${URL}/airlines/logos/adopt-high-confidence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dryRun }),
  });
}

export async function deleteAirlineLogoApi(iataCode) {
  return await apiFetch(`${URL}/airlines/${iataCode}/logo`, { method: 'DELETE' });
}
