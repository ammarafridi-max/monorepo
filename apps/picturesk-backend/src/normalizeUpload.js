import sharp from 'sharp';
import convertHeic from 'heic-convert';

const HEIC_TYPES = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence']);

function isHeic(url, contentType) {
  return HEIC_TYPES.has(String(contentType || '').split(';')[0].trim().toLowerCase()) || /\.hei[cf](\?|$)/i.test(url);
}

export async function normalizeUpload(storage, url) {
  const key = storage.keyForUrl(url);
  if (!key) return url;

  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) return url;
  const contentType = res.headers.get('content-type');
  if (!isHeic(url, contentType)) return url;

  const input = Buffer.from(await res.arrayBuffer());
  const decoded = Buffer.from(await convertHeic({ buffer: input, format: 'JPEG', quality: 0.95 }));
  const jpeg = await sharp(decoded).rotate().jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  const jpegKey = key.replace(/\.[^./]+$/, '') + '.jpg';
  return storage.putObject(jpegKey, jpeg, 'image/jpeg');
}
