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

// Hard cap on the browser check. Some browsers (notably macOS Chrome) expose
// FaceDetector but its detect() never resolves, which would leave a photo stuck
// showing the "checking" overlay forever and keep the CTA disabled. If detection
// does not finish in time we give up and defer to the server (the real gate).
const DETECT_TIMEOUT_MS = 3000;

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('detect-timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Detect faces in a File using the built-in FaceDetector (zero bundle cost).
 * Returns { faceCount, maxFaceBoxRatio }, or null when detection is unavailable,
 * stalls, or errors. In every null case the client defers to the server, which
 * re-runs the same checks and is the authoritative gate, so a flaky or hung
 * browser detector can never block the upload.
 */
export async function detectImage(file) {
  if (!faceCheckAvailable()) return null;
  let bitmap;
  try {
    bitmap = await withTimeout(createImageBitmap(file), DETECT_TIMEOUT_MS);
    // eslint-disable-next-line no-undef
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
    const faces = await withTimeout(detector.detect(bitmap), DETECT_TIMEOUT_MS);
    const maxFaceBoxRatio = faces.reduce((m, f) => {
      const b = f.boundingBox;
      return Math.max(m, b.width / bitmap.width, b.height / bitmap.height);
    }, 0);
    return { faceCount: faces.length, maxFaceBoxRatio };
  } catch {
    // Timeout, or a broken / unavailable detector: defer to the server rather
    // than hard-failing a photo the browser simply could not check.
    return null;
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
