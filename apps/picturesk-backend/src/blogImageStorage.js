import { randomUUID } from 'node:crypto';
import { AppError } from '@travel-suite/utils';

/**
 * The blog domain's image storage, backed by R2.
 *
 * The travel brands inject the Cloudinary client here. Picturesk has no
 * Cloudinary account and already owns an R2 bucket, so it adapts the storage it
 * has to the two methods the blog service actually calls:
 *
 *   saveImage(buffer, blogId) -> the public URL of the stored image
 *   deleteImage(url)          -> best effort, non-fatal to the caller
 *
 * Cover images live under `blog/<blogId>/` so a post's images can be found (and
 * removed) as a group, and are namespaced away from customer uploads.
 */

// The blog service hands us a bare buffer with no mimetype, so the content type
// is read from the magic bytes. Storing the wrong one makes the browser download
// the file instead of rendering it.
const SIGNATURES = [
  { type: 'image/jpeg', ext: 'jpg',  test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'image/png',  ext: 'png',  test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { type: 'image/gif',  ext: 'gif',  test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  {
    type: 'image/webp',
    ext: 'webp',
    test: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
];

function sniff(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    throw new AppError('That file is not a readable image', 400);
  }
  const match = SIGNATURES.find((s) => s.test(buffer));
  if (!match) {
    throw new AppError('Cover image must be a JPEG, PNG, WebP, or GIF', 400);
  }
  return match;
}

/**
 * @param {{ storage: ReturnType<import('@travel-suite/picturesk-shared').createStorage> | null, logger?: Console }} deps
 */
export function createBlogImageStorage({ storage, logger = console }) {
  if (!storage) return null;

  return {
    async saveImage(buffer, blogId) {
      const { type, ext } = sniff(buffer);
      const key = `blog/${blogId}/${randomUUID()}.${ext}`;
      return storage.putObject(key, buffer, type);
    },

    async deleteImage(imageUrl) {
      // keyForUrl returns null for anything outside our bucket, so a cover image
      // that was pasted in from elsewhere is skipped rather than mis-deleted.
      const key = storage.keyForUrl(imageUrl);
      if (!key) return;
      const { failed } = await storage.deleteObjects([key]);
      if (failed) logger.warn(`[api] blog image delete failed for ${key}`);
    },
  };
}
