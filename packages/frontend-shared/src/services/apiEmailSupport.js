import { apiFetch } from './apiClient.js';

const URL = '/api/email-support';

export async function getEmailsApi(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.status && params.status !== 'all') searchParams.set('status', params.status);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  const qs = searchParams.toString();
  return apiFetch(`${URL}${qs ? `?${qs}` : ''}`);
}

export async function updateDraftApi(id, draft) {
  return apiFetch(`${URL}/${id}/draft`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ draft }),
  });
}

export async function sendReplyApi(id) {
  return apiFetch(`${URL}/${id}/send`, { method: 'POST' });
}

export async function skipEmailApi(id) {
  return apiFetch(`${URL}/${id}/skip`, { method: 'POST' });
}
