
function int(v, fallback) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}
function float(v, fallback) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export const QUALITY = Object.freeze({
  minPhotos: int(process.env.UPLOAD_MIN_PHOTOS, 5),
  maxPhotos: int(process.env.UPLOAD_MAX_PHOTOS, 15),
  minFaceBoxRatio: float(process.env.UPLOAD_MIN_FACE_RATIO, 0.12),
});

export const REASONS = Object.freeze({
  noFace: 'No clear face',
  multipleFaces: 'More than one person',
  faceTooSmall: 'Face too small, get closer',
  unreadable: 'We could not read this photo',
  sunglasses: 'Take the sunglasses off',
  hat: 'No hats or caps',
  blurry: 'Too blurry, use a sharp photo',
  dark: 'Too dark, use good lighting',
});

const REASON_BY_ISSUE = Object.freeze({
  sunglasses: REASONS.sunglasses,
  hat: REASONS.hat,
});

export function reasonForImage(d, q = QUALITY) {
  if (d.error) return REASONS.unreadable;
  if (!d.faceCount) return REASONS.noFace;
  const subjectCount = d.subjectCount ?? d.faceCount;
  if (subjectCount > 1) return REASONS.multipleFaces;
  if (d.maxFaceBoxRatio < q.minFaceBoxRatio) return REASONS.faceTooSmall;
  if (d.qualityIssue && REASON_BY_ISSUE[d.qualityIssue]) return REASON_BY_ISSUE[d.qualityIssue];
  return null;
}

export function evaluateImages(images, q = QUALITY) {
  const failures = [];
  for (const img of images) {
    const reason = reasonForImage(img, q);
    if (reason) failures.push({ index: img.index, url: img.url, reason });
  }
  return failures;
}

export function countError(n, q = QUALITY) {
  if (n < q.minPhotos) return `Add at least ${q.minPhotos} photos`;
  if (n > q.maxPhotos) return `Use at most ${q.maxPhotos} photos`;
  return null;
}
