// Client mirror of the server upload gate (apps/api/uploadGate.js). This is UX
// only: it gives fast feedback and disables the CTA, but the SERVER re-runs the
// same checks in /checkout and is the real gate. Thresholds default to the server
// defaults and can be tuned with NEXT_PUBLIC_UPLOAD_* envs (keep in sync).

function num(v, fallback) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export const QUALITY = {
  minPhotos: num(process.env.NEXT_PUBLIC_UPLOAD_MIN_PHOTOS, 5),
  maxPhotos: num(process.env.NEXT_PUBLIC_UPLOAD_MAX_PHOTOS, 15),
  minFaceBoxRatio: num(process.env.NEXT_PUBLIC_UPLOAD_MIN_FACE_RATIO, 0.15),
};

export const REASONS = {
  noFace: 'No clear face',
  multipleFaces: 'More than one person',
  faceTooSmall: 'Face too small, get closer',
  unreadable: 'We could not read this photo',
};

/** The native FaceDetector (Shape Detection API) is Chromium-only and optional. */
export function faceCheckAvailable() {
  return typeof window !== 'undefined' && 'FaceDetector' in window;
}

/**
 * Detect faces in a File using the built-in FaceDetector (zero bundle cost).
 * Returns { faceCount, maxFaceBoxRatio }, or null when detection is unavailable
 * (then the client defers to the server, which always checks).
 */
export async function detectImage(file) {
  if (!faceCheckAvailable()) return null;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    // eslint-disable-next-line no-undef
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
    const faces = await detector.detect(bitmap);
    const maxFaceBoxRatio = faces.reduce((m, f) => {
      const b = f.boundingBox;
      return Math.max(m, b.width / bitmap.width, b.height / bitmap.height);
    }, 0);
    return { faceCount: faces.length, maxFaceBoxRatio };
  } catch {
    return { error: true, faceCount: 0, maxFaceBoxRatio: 0 };
  } finally {
    bitmap?.close?.();
  }
}

/** Same decision as the server's reasonForImage. null detection -> defer (no complaint). */
export function reasonFor(detection, q = QUALITY) {
  if (!detection) return null;
  if (detection.error) return REASONS.unreadable;
  if (!detection.faceCount) return REASONS.noFace;
  if (detection.faceCount > 1) return REASONS.multipleFaces;
  if (detection.maxFaceBoxRatio < q.minFaceBoxRatio) return REASONS.faceTooSmall;
  return null;
}
