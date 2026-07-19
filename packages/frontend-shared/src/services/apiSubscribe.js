import { apiFetch } from './apiClient.js';

const URL = '/api/subscribe';

export async function subscribeToLaunchListApi(payload) {
  return await apiFetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
