import { apiFetch } from './apiClient.js';

const URL = '/api/currencies';

function currencyQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export async function getCurrenciesApi(params = {}) {
  return await apiFetch(`${URL}${currencyQuery(params)}`);
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
