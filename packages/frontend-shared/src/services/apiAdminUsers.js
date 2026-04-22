import { apiFetch } from './apiClient.js';

const URL = '/api/admin-users';

export async function getAdminUsersApi(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return await apiFetch(queryString ? `${URL}?${queryString}` : URL);
}

export async function getAdminUserApi(username) {
  return await apiFetch(`${URL}/${username}`);
}

export async function createAdminUserApi(userData) {
  return await apiFetch(URL, {
    method: 'POST',
    body: JSON.stringify(userData),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function updateAdminUserApi(username, userData) {
  return await apiFetch(`${URL}/${username}`, {
    method: 'PATCH',
    body: JSON.stringify(userData),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function deleteAdminUserApi(username) {
  return await apiFetch(`${URL}/${username}`, {
    method: 'DELETE',
  });
}
