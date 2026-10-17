export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

async function asJson(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `request failed (${res.status})`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export async function presignUploads(files) {
  const res = await fetch(`${API_BASE}/uploads/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: files.map((f) => ({ filename: f.name, contentType: f.type })),
    }),
  });
  return asJson(res); 
}

export async function putToStorage(uploadUrl, file) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error(`upload failed (${res.status})`);
}

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

export async function gateUploads(uploadedImageUrls) {
  const res = await fetch(`${API_BASE}/uploads/gate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadedImageUrls }),
  });
  return asJson(res);
}

export async function getOrder(orderId, token) {
  const qs = token ? `?t=${encodeURIComponent(token)}` : '';
  const res = await fetch(`${API_BASE}/orders/${orderId}${qs}`, { cache: 'no-store' });
  return asJson(res);
}

export function downloadUrl(orderId, index, token) {
  const qs = token ? `?t=${encodeURIComponent(token)}` : '';
  return `${API_BASE}/orders/${orderId}/download/${index}${qs}`;
}

export function downloadAllUrl(orderId, token) {
  const qs = token ? `?t=${encodeURIComponent(token)}` : '';
  return `${API_BASE}/orders/${orderId}/download-all${qs}`;
}
