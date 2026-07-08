/**
 * Upload quality gate: rules + thresholds. Pure, no I/O, so they can be unit
 * tested and reused. The face DETECTION (the I/O) lives in faceDetector.js; this
 * module only decides pass/fail from detection results.
 *
 * These rules are the SERVER copy. The web client mirrors them for fast feedback,
 * but the server is the real gate (see POST /checkout). Keep the two in sync; the
 * thresholds are env-driven on both sides so they can be tuned without code edits.
 */

function int(v, fallback) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}
function float(v, fallback) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Tunable thresholds (env-overridable). */
export const QUALITY = Object.freeze({
  minPhotos: int(process.env.UPLOAD_MIN_PHOTOS, 5),
  maxPhotos: int(process.env.UPLOAD_MAX_PHOTOS, 15),
  // The face bounding box must span at least this fraction of the image in its
  // larger dimension. Rejects tiny/far faces. ~0.15 = face is >=15% of the frame.
  minFaceBoxRatio: float(process.env.UPLOAD_MIN_FACE_RATIO, 0.15),
});

/** Short, calm, branded reasons (no em dashes, no scary language). */
export const REASONS = Object.freeze({
  noFace: 'No clear face',
  multipleFaces: 'More than one person',
  faceTooSmall: 'Face too small, get closer',
  unreadable: 'We could not read this photo',
});

/**
 * Decide one image from its detection result.
 * @param {{ faceCount: number, maxFaceBoxRatio: number, error?: boolean }} d
 * @param {typeof QUALITY} [q]
 * @returns {string|null} a reason if it fails, else null
 */
export function reasonForImage(d, q = QUALITY) {
  if (d.error) return REASONS.unreadable;
  if (!d.faceCount) return REASONS.noFace;
  if (d.faceCount > 1) return REASONS.multipleFaces;
  if (d.maxFaceBoxRatio < q.minFaceBoxRatio) return REASONS.faceTooSmall;
  return null;
}

/**
 * Evaluate every image. Returns the per-image failures (empty = all pass).
 * @param {Array<{ index: number, url?: string, faceCount: number, maxFaceBoxRatio: number, error?: boolean }>} images
 * @param {typeof QUALITY} [q]
 * @returns {Array<{ index: number, url?: string, reason: string }>}
 */
export function evaluateImages(images, q = QUALITY) {
  const failures = [];
  for (const img of images) {
    const reason = reasonForImage(img, q);
    if (reason) failures.push({ index: img.index, url: img.url, reason });
  }
  return failures;
}

/**
 * Enforce the promised count. Returns a message if out of range, else null.
 * @param {number} n
 * @param {typeof QUALITY} [q]
 */
export function countError(n, q = QUALITY) {
  if (n < q.minPhotos) return `Add at least ${q.minPhotos} photos`;
  if (n > q.maxPhotos) return `Use at most ${q.maxPhotos} photos`;
  return null;
}
