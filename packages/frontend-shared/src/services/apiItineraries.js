import { apiFetchPublic } from './apiClient.js';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

const URL = '/api/itineraries';

// Generation runs an AI call plus a server-side PDF render, so it needs a long timeout.
const GENERATE_TIMEOUT_MS = 60_000;

export async function createItineraryApi(input, files) {
  if (files && files.length) {
    const form = new FormData();
    form.append('data', JSON.stringify(input));
    for (const f of files) form.append('documents', f);
    return apiFetchPublic(URL, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
    });
  }
  return apiFetchPublic(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
  });
}

export async function getItineraryOrderApi(sessionId) {
  return apiFetchPublic(`${URL}/${sessionId}`);
}

export async function deleteItineraryOrderApi(sessionId) {
  const res = await fetch(`${BACKEND}${URL}/${sessionId}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) {
    let message = 'Failed to delete itinerary';
    try {
      const json = await res.json();
      message = json.message || json.error || message;
    } catch { /* non-JSON error body */ }
    throw new Error(message);
  }
  return true;
}

export async function getItineraryOrderDetailApi(sessionId) {
  const res = await fetch(`${BACKEND}${URL}/${sessionId}/detail`, { credentials: 'include' });
  if (!res.ok) {
    let message = 'Failed to fetch itinerary';
    try {
      const json = await res.json();
      message = json.message || json.error || message;
    } catch { /* non-JSON error body */ }
    throw new Error(message);
  }
  const json = await res.json();
  return json.data;
}

export async function getItineraryOrdersApi(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BACKEND}${URL}?${qs}`, { credentials: 'include' });
  if (!res.ok) {
    let message = 'Failed to fetch itineraries';
    try {
      const json = await res.json();
      message = json.message || json.error || message;
    } catch { /* non-JSON error body */ }
    throw new Error(message);
  }
  const json = await res.json();
  return { data: json.data ?? [], pagination: json.pagination };
}

export async function regenerateItineraryApi(sessionId) {
  return apiFetchPublic(`${URL}/${sessionId}/regenerate`, {
    method: 'POST',
    signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
  });
}

export async function editItineraryApi({ sessionId, updates }) {
  return apiFetchPublic(`${URL}/${sessionId}/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
    signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
  });
}

export async function sendItineraryChatApi({ sessionId, message }) {
  return apiFetchPublic(`${URL}/${sessionId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
  });
}

export async function getItineraryChatApi(sessionId) {
  return apiFetchPublic(`${URL}/${sessionId}/chat`);
}

export async function parseDocumentsApi(files) {
  const form = new FormData();
  for (const f of files) form.append('documents', f);
  return apiFetchPublic(`${URL}/parse-documents`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
  });
}

export async function checkoutItineraryApi(sessionId) {
  return apiFetchPublic(`${URL}/${sessionId}/checkout`, { method: 'POST' });
}

export function itineraryPreviewUrl(sessionId) {
  return `${BACKEND}${URL}/${sessionId}/preview`;
}

export function itineraryDocumentUrl(sessionId) {
  return `${BACKEND}${URL}/${sessionId}/document`;
}
