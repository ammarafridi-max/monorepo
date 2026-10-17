
function num(v, fallback) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export const QUALITY = {
  minPhotos: num(process.env.NEXT_PUBLIC_UPLOAD_MIN_PHOTOS, 5),
  maxPhotos: num(process.env.NEXT_PUBLIC_UPLOAD_MAX_PHOTOS, 15),
  minFaceBoxRatio: num(process.env.NEXT_PUBLIC_UPLOAD_MIN_FACE_RATIO, 0.12),
};

export const REASONS = {
  noFace: 'No clear face',
  multipleFaces: 'More than one person',
  faceTooSmall: 'Face too small, get closer',
  unreadable: 'We could not read this photo',
};

export function faceCheckAvailable() {
  return typeof window !== 'undefined' && 'FaceDetector' in window;
}

const DETECT_TIMEOUT_MS = 3000;

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('detect-timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

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
    return null;
  } finally {
    bitmap?.close?.();
  }
}

export function reasonFor(detection, q = QUALITY) {
  if (!detection) return null;
  if (detection.error) return REASONS.unreadable;
  if (!detection.faceCount) return REASONS.noFace;
  if (detection.faceCount > 1) return REASONS.multipleFaces;
  if (detection.maxFaceBoxRatio < q.minFaceBoxRatio) return REASONS.faceTooSmall;
  return null;
}
