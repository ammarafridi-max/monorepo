import { createStorage } from '@travel-suite/picturesk-shared';


const EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

export function createImagePersister() {
  const storage = createStorage();

  return async function persistImage(sourceUrl, keyBase) {
    const res = await fetch(sourceUrl);
    if (!res.ok) {
      throw new Error(`[persist] fetch ${sourceUrl} -> ${res.status}`);
    }
    const contentType = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
    const body = Buffer.from(await res.arrayBuffer());
    const ext = EXT[contentType] || 'jpg';
    const imageUrl = await storage.putObject(`${keyBase}.${ext}`, body, contentType);
    return { imageUrl };
  };
}

export function createWeightsPersister() {
  const storage = createStorage();

  return async function persistWeights(sourceUrl, keyBase) {
    const res = await fetch(sourceUrl);
    if (!res.ok) {
      throw new Error(`[persist] fetch weights ${sourceUrl} -> ${res.status}`);
    }
    const ext = /\.safetensors(\?|$)/.test(sourceUrl) ? 'safetensors' : 'tar';
    const body = Buffer.from(await res.arrayBuffer());
    const weightsUrl = await storage.putObject(`${keyBase}.${ext}`, body, 'application/octet-stream');
    return { weightsUrl };
  };
}
