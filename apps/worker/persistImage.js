import { createStorage } from '@picturesk/shared';

/**
 * Copies a delivered image OUT of the ephemeral upstream host (replicate.delivery,
 * which garbage-collects prediction outputs within ~an hour) and INTO our own R2
 * bucket, so the customer's headshots never 404. Returns the permanent R2 URL.
 *
 * createImagePersister() builds the R2 client once (R2 is already a hard
 * requirement of the worker, used for the training zip) and returns the persist
 * function the pipeline injects. Symmetric with swapFace/enhanceFace: a
 * { imageUrl } contract, so the pipeline treats it as one more resumable stage.
 */

// content-type -> file extension for the stored key. Defaults to jpg.
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

  /**
   * @param {string} sourceUrl - the upstream (replicate.delivery) image URL
   * @param {string} keyBase   - key WITHOUT extension, e.g. "deliveries/<orderId>/<i>"
   * @returns {Promise<{ imageUrl: string }>} the permanent R2 public URL
   */
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
