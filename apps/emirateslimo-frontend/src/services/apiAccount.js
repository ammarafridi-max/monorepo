import { apiFetch } from './apiClient';

export async function getMyAccountApi() {
  return await apiFetch(`/api/users/me`, {
    method: 'GET',
  });
}

export async function updateAccountApi(data) {
  return await apiFetch(`/api/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function updatePasswordApi(accountData) {
  return await apiFetch(`/api/users/me/password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(accountData),
  });
}
