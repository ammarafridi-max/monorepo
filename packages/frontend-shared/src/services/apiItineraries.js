import { apiFetchPublic } from './apiClient.js';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

const URL = '/api/itineraries';

// Generation runs a Claude call + server-side PDF render, so it can take much
// longer than the 8s default. Give these calls a generous timeout.
const GENERATE_TIMEOUT_MS = 60_000;

// Create an order and generate the first (validated, watermarked) itinerary.
// Returns metadata only — never the clean itinerary content. When supporting
// documents are provided, sends multipart (input as a `data` JSON field + the
// files) so the backend can archive them under the new order; otherwise JSON.
export async function createItineraryApi(input, files) {
  if (files && files.length) {
    const form = new FormData();
    form.append('data', JSON.stringify(input));
    for (const f of files) form.append('documents', f);
    // No Content-Type header — the browser sets the multipart boundary.
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

// Fetch order status/metadata (status, paymentStatus, regens remaining, etc.).
export async function getItineraryOrderApi(sessionId) {
  return apiFetchPublic(`${URL}/${sessionId}`);
}

// Admin: delete an itinerary (+ its Cloudinary assets). Admin-only, cookie-authed.
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

// Admin: full order detail incl. Cloudinary document URLs (cookie-authed).
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

// Admin: paginated/searchable/filterable list of all itineraries (cookie-authed).
// Returns { data, pagination }.
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

// Regenerate (pre-payment). Subject to the free-regeneration cap server-side.
export async function regenerateItineraryApi(sessionId) {
  return apiFetchPublic(`${URL}/${sessionId}/regenerate`, {
    method: 'POST',
    signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
  });
}

// Post-payment edit (free within the edit window, then a paid revision).
export async function editItineraryApi({ sessionId, updates }) {
  return apiFetchPublic(`${URL}/${sessionId}/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
    signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
  });
}

// Conversational AI edit. Returns { reply, messages, meta, applied } — never the
// clean itinerary content. Slow (Claude + re-render), so use the long timeout.
export async function sendItineraryChatApi({ sessionId, message }) {
  return apiFetchPublic(`${URL}/${sessionId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
  });
}

// Conversation history: array of { role, text, at }.
export async function getItineraryChatApi(sessionId) {
  return apiFetchPublic(`${URL}/${sessionId}/chat`);
}

// Upload supporting documents -> { segments, reservations } to prefill the form.
// Multipart; let the browser set the Content-Type boundary.
export async function parseDocumentsApi(files) {
  const form = new FormData();
  for (const f of files) form.append('documents', f);
  return apiFetchPublic(`${URL}/parse-documents`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
  });
}

// Returns the Stripe-hosted checkout URL (string).
export async function checkoutItineraryApi(sessionId) {
  return apiFetchPublic(`${URL}/${sessionId}/checkout`, { method: 'POST' });
}

// Direct asset URLs. Preview is a watermarked flat image (safe pre-payment);
// the document is the clean PDF, gated behind payment server-side.
export function itineraryPreviewUrl(sessionId) {
  return `${BACKEND}${URL}/${sessionId}/preview`;
}

export function itineraryDocumentUrl(sessionId) {
  return `${BACKEND}${URL}/${sessionId}/document`;
}
