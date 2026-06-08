import { apiFetch } from './apiClient';

export async function loginApi(credentials) {
  return await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
}

export async function getMeApi() {
  return await apiFetch('/api/users/me');
}
