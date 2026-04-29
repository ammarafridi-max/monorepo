import { apiFetch } from './apiClient.js';

const URL = '/api/admin-users';

export async function getAdminUsersApi(params = {}) {
  // Drop undefined/null/empty values so they're not serialized as the literal
  // string "undefined" in the query string (URLSearchParams stringifies values).
  const clean = Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== '',
    ),
  );
  const queryString = new URLSearchParams(clean).toString();
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
