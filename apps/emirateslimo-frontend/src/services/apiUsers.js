import { apiFetch } from './apiClient';

const URL = '/api/users';

export async function getUsers() {
  return await apiFetch(URL);
}

export async function getUser(username) {
  return await apiFetch(`${URL}/${username}`);
}

export async function createUserApi(userData) {
  return await apiFetch(URL, {
    method: 'POST',
    body: JSON.stringify(userData),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function updateUserApi(username, userData) {
  return await apiFetch(`${URL}/${username}`, {
    method: 'PATCH',
    body: JSON.stringify(userData),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function deleteUserApi(username) {
  return await apiFetch(`${URL}/${username}`, {
    method: 'DELETE',
  });
}
