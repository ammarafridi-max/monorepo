// Base URL of the Express api. Inlined at build via NEXT_PUBLIC_.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

async function asJson(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Carry status + parsed body so callers can handle structured errors like the
    // 422 quality-gate response (per-image failure reasons) instead of a bare message.
    const err = new Error(body.error || `request failed (${res.status})`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

/** Ask the api for presigned PUT URLs, one per file. */
export async function presignUploads(files) {
  const res = await fetch(`${API_BASE}/uploads/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: files.map((f) => ({ filename: f.name, contentType: f.type })),
    }),
  });
  return asJson(res); // { uploads: [{ uploadUrl, publicUrl, ... }] }
}

/** PUT one file straight to R2. Bytes never touch our api. */
export async function putToStorage(uploadUrl, file) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error(`upload failed (${res.status})`);
}

/**
 * Create the order + Stripe session from the selections AND the already-uploaded
 * photos (payment is the last step). Returns { orderId, checkoutUrl }. On a gate
 * failure throws with err.status === 422 and err.body.failures (per-photo reasons)
 * so the UI can flag which photos to swap.
 */
export async function createCheckout({
  email,
  selectedLooks,
  selectedAttire,
  gender,
  ageRange,
  race,
  facialHair,
  uploadedImageUrls,
}) {
  const res = await fetch(`${API_BASE}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      selectedLooks,
      selectedAttire,
      gender,
      ageRange,
      race,
      facialHair,
      uploadedImageUrls,
    }),
  });
  return asJson(res);
}

/** Public order view for the success page to poll. */
export async function getOrder(orderId) {
  const res = await fetch(`${API_BASE}/orders/${orderId}`, { cache: 'no-store' });
  return asJson(res);
}

/**
 * URL that streams one delivered headshot with Content-Disposition: attachment,
 * so pointing an <a> at it downloads the file instead of opening it in a new tab
 * (the plain `download` attribute is ignored for cross-origin R2 URLs).
 */
export function downloadUrl(orderId, index) {
  return `${API_BASE}/orders/${orderId}/download/${index}`;
}
