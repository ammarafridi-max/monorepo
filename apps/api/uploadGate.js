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
  // The subject's bounding box must span at least this fraction of the image in its
  // larger dimension. Rejects tiny/far subjects. ~0.12 = subject is >=12% of the
  // frame (eased from 0.15 so a normal arm's-length shot is not called "too small").
  minFaceBoxRatio: float(process.env.UPLOAD_MIN_FACE_RATIO, 0.12),
});

/** Short, calm, branded reasons (no em dashes, no scary language). */
export const REASONS = Object.freeze({
  noFace: 'No clear face',
  multipleFaces: 'More than one person',
  faceTooSmall: 'Face too small, get closer',
  unreadable: 'We could not read this photo',
  // Strict-gate reasons (from the vision screen in photoGate.js).
  sunglasses: 'Take the sunglasses off',
  hat: 'No hats or caps',
  blurry: 'Too blurry, use a sharp photo',
  dark: 'Too dark, use good lighting',
});

// Map a strict-gate issue id to its reason. Deliberately ONLY the two unambiguous,
// training-wrecking cases (sunglasses, hat). `blurry`/`dark` are subjective and were
// rejecting good photos, and `far`/`group` are the face detector's job -- all map to
// null here so they never reject.
const REASON_BY_ISSUE = Object.freeze({
  sunglasses: REASONS.sunglasses,
  hat: REASONS.hat,
});

/**
 * Decide one image from its detection result. `qualityIssue` (optional) is the
 * strict-gate verdict from the vision screen (photoGate.js).
 * @param {{ faceCount: number, subjectCount?: number, maxFaceBoxRatio: number, error?: boolean, qualityIssue?: string|null }} d
 * @param {typeof QUALITY} [q]
 * @returns {string|null} a reason if it fails, else null
 */
export function reasonForImage(d, q = QUALITY) {
  if (d.error) return REASONS.unreadable;
  if (!d.faceCount) return REASONS.noFace;
  // "More than one person" now keys on SUBJECT-sized people, not every detection,
  // so a small bystander / spurious box on a solo photo no longer rejects it.
  // Falls back to faceCount when subjectCount is absent (older cached results).
  const subjectCount = d.subjectCount ?? d.faceCount;
  if (subjectCount > 1) return REASONS.multipleFaces;
  if (d.maxFaceBoxRatio < q.minFaceBoxRatio) return REASONS.faceTooSmall;
  // Strict attribute checks (sunglasses / hat / blurry / dark) from the VLM screen.
  if (d.qualityIssue && REASON_BY_ISSUE[d.qualityIssue]) return REASON_BY_ISSUE[d.qualityIssue];
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
