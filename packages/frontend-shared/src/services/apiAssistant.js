import { apiFetch, apiUpload, csrfHeader } from './apiClient.js';

const URL = '/api/assistant';
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function getAssistantMetaApi() {
  return await apiFetch(`${URL}/meta`);
}

export async function getAssistantConversationsApi() {
  const result = await apiFetch(`${URL}/conversations`);
  return result?.conversations || [];
}

export async function getAssistantConversationApi(id) {
  const result = await apiFetch(`${URL}/conversations/${id}`);
  return result?.conversation || null;
}

export async function getAssistantAuditApi(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null),
  ).toString();

  const result = await apiFetch(`${URL}/audit?${query}`);
  return { calls: result?.calls || [], pagination: result?.pagination || null };
}

export async function getAssistantUsageApi(days = 30) {
  const result = await apiFetch(`${URL}/usage?days=${days}`);
  return result?.usage || null;
}

export async function uploadAssistantAdImageApi(file) {
  const form = new FormData();
  form.append('image', file);

  const result = await apiUpload('/api/openai-ads/images', form);
  return result?.fileId ?? null;
}

export async function decideAssistantActionApi({ id, approve }) {
  return await apiFetch(`${URL}/actions/${id}/${approve ? 'approve' : 'cancel'}`, { method: 'POST' });
}

export async function deleteAssistantConversationApi(id) {
  return await apiFetch(`${URL}/conversations/${id}`, { method: 'DELETE' });
}

function parseEvent(chunk) {
  let event = 'message';
  const data = [];

  for (const line of chunk.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).trim());
  }

  if (!data.length) return null;

  try {
    return { event, payload: JSON.parse(data.join('\n')) };
  } catch {
    return null;
  }
}

export async function streamAssistantMessageApi({ conversationId, message, nav, onEvent, signal }) {
  const res = await fetch(`${BACKEND}${URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...csrfHeader('POST') },
    credentials: 'include',
    signal,
    body: JSON.stringify({ conversationId, message, nav }),
  });

  if (!res.ok || !res.body) {
    let detail = 'The assistant is unavailable right now';
    try {
      const json = await res.json();
      detail = json.message || detail;
    } catch {
      detail = res.statusText || detail;
    }
    const error = new Error(detail);
    error.status = res.status;
    throw error;
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += value;
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';

    for (const chunk of chunks) {
      const parsed = parseEvent(chunk);
      if (parsed) onEvent(parsed.payload);
    }
  }

  const trailing = parseEvent(buffer);
  if (trailing) onEvent(trailing.payload);
}
