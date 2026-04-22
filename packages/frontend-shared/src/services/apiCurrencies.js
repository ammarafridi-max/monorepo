import { apiFetch } from './apiClient.js';

const URL = '/api/currencies';

export async function getCurrenciesApi() {
  return await apiFetch(URL);
}

export async function getCurrencyApi(code) {
  return await apiFetch(`${URL}/${code}`);
}

export async function createCurrencyApi(currencyData) {
  return await apiFetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(currencyData),
  });
}

export async function updateCurrencyApi(code, currencyData) {
  return await apiFetch(`${URL}/${code}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(currencyData),
  });
}

export async function deleteCurrencyApi(code) {
  return await apiFetch(`${URL}/${code}`, {
    method: 'DELETE',
  });
}
