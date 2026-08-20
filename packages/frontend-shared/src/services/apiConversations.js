import { apiFetch, apiFetchBlob, apiUpload } from './apiClient.js';

const URL = '/api/conversations';

export async function getConversationsApi(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  // apiFetch already returns json.data — do not unwrap again.
  return (await apiFetch(`${URL}${queryString ? `?${queryString}` : ''}`)) ?? [];
}

export async function getConversationThreadApi(waId) {
  return (await apiFetch(`${URL}/${waId}`)) ?? null;
}

export async function markConversationReadApi(waId) {
  return (await apiFetch(`${URL}/${waId}/read`, { method: 'PATCH' })) ?? null;
}

export async function sendConversationMessageApi({ waId, text, replyTo }) {
  return await apiFetch(`${URL}/${waId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, replyTo: replyTo ?? null }),
  });
}

export async function sendConversationMediaApi({ waId, file, caption, replyTo }) {
  const fd = new FormData();
  fd.append('file', file);
  if (caption) fd.append('caption', caption);
  if (replyTo) fd.append('replyTo', replyTo);
  return await apiUpload(`${URL}/${waId}/messages/media`, fd);
}

export async function getSavedRepliesApi() {
  return (await apiFetch('/api/conversations/saved-replies')) ?? [];
}

export async function createSavedReplyApi({ title, body }) {
  return await apiFetch('/api/conversations/saved-replies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body }),
  });
}

export async function deleteSavedReplyApi(id) {
  return await apiFetch(`/api/conversations/saved-replies/${id}`, { method: 'DELETE' });
}

export async function getMessageMediaApi(messageId) {
  return await apiFetchBlob(`${URL}/media/${messageId}`);
}

export async function getAssignableAgentsApi() {
  return (await apiFetch(`${URL}/agents`)) ?? [];
}

export async function claimConversationApi(waId) {
  return await apiFetch(`${URL}/${waId}/claim`, { method: 'POST' });
}

export async function assignConversationApi({ waId, adminUserId }) {
  return await apiFetch(`${URL}/${waId}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminUserId }),
  });
}
