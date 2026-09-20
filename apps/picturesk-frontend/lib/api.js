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
 * Create the order and, for a paid plan, the Stripe session. Goes through the web
 * app's own /api/checkout, which attaches the signed-in user. Returns
 * { orderId, checkoutUrl, free? }: for a free plan checkoutUrl is already the
 * success page. Throws with err.status on 401/403 (sign in / verify), 409 (free
 * plan already used) and 422 (gate failures, err.body.failures).
 */
export async function createCheckout({
  selectedLooks,
  selectedAttire,
  gender,
  ageRange,
  race,
  facialHair,
  build,
  height,
  uploadedImageUrls,
  reuseFromOrderId,
  tier,
  product,
}) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedLooks,
      selectedAttire,
      gender,
      ageRange,
      race,
      facialHair,
      build,
      height,
      uploadedImageUrls,
      reuseFromOrderId,
      tier,
      product,
    }),
  });
  return asJson(res);
}

/**
 * Run the server upload gate on already-uploaded photo URLs WITHOUT creating an
 * order. Called from the upload step so the slow evaluation happens there, not on
 * the pay button (results are cached, so /checkout is then instant). Returns
 * { ok: true } on pass; on failure throws with err.status === 422 and
 * err.body.failures (per-photo reasons).
 */
export async function gateUploads(uploadedImageUrls) {
  const res = await fetch(`${API_BASE}/uploads/gate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadedImageUrls }),
  });
  return asJson(res);
}

/**
 * Public order view for the success page to poll. `token` is the order's access
 * token, handed to the buyer in the Stripe success_url and the delivery email.
 * Checkout is anonymous, so it is the only credential that exists.
 */
export async function getOrder(orderId, token) {
  const qs = token ? `?t=${encodeURIComponent(token)}` : '';
  const res = await fetch(`${API_BASE}/orders/${orderId}${qs}`, { cache: 'no-store' });
  return asJson(res);
}

/**
 * URL that streams one delivered headshot with Content-Disposition: attachment,
 * so pointing an <a> at it downloads the file instead of opening it in a new tab
 * (the plain `download` attribute is ignored for cross-origin R2 URLs).
 */
export function downloadUrl(orderId, index, token) {
  const qs = token ? `?t=${encodeURIComponent(token)}` : '';
  return `${API_BASE}/orders/${orderId}/download/${index}${qs}`;
}

/**
 * URL that streams ALL delivered headshots as one zip attachment
 * (picturesk-headshots.zip), so "Download all" saves a single file instead of
 * firing one download per image.
 */
export function downloadAllUrl(orderId, token) {
  const qs = token ? `?t=${encodeURIComponent(token)}` : '';
  return `${API_BASE}/orders/${orderId}/download-all${qs}`;
}
