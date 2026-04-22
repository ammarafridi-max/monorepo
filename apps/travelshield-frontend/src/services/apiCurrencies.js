import { apiFetch } from './apiClient';

const URL = '/api/currencies';

export async function getCurrenciesApi(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return await apiFetch(queryString ? `${URL}?${queryString}` : URL);
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
