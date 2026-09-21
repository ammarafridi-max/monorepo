// Browser-side measurements for the free photo tools. Everything here runs on a
// canvas in the visitor's tab, so it costs nothing and the photo does not have to
// leave the device for it. Face detection is MediaPipe BlazeFace (lib/faceDetect.js),
// which works in every modern browser; if it fails to load the face fields are
// null and the server's judgment carries more weight.

import { detectFaces } from './faceDetect';

const MAX_SIDE = 1024;

async function toBitmap(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, w, h);
  return { canvas, ctx, w, h, naturalW: bitmap.width, naturalH: bitmap.height, bitmap };
}

function luminance(data, i) {
  return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
}

// Variance of a Laplacian over a grey copy: the classic blur measure.
function sharpnessOf(ctx, w, h) {
  const { data } = ctx.getImageData(0, 0, w, h);
  const grey = new Float32Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) grey[p] = luminance(data, i);
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const lap = 4 * grey[p] - grey[p - 1] - grey[p + 1] - grey[p - w] - grey[p + w];
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }
  const mean = sum / n;
  return Math.round(sumSq / n - mean * mean);
}

function exposureOf(ctx, w, h) {
  const { data } = ctx.getImageData(0, 0, w, h);
  let sum = 0;
  let sumSq = 0;
  const n = w * h;
  for (let i = 0; i < data.length; i += 4) {
    const l = luminance(data, i);
    sum += l;
    sumSq += l * l;
  }
  const mean = sum / n;
  return { brightness: Math.round(mean), contrast: Math.round(Math.sqrt(sumSq / n - mean * mean)) };
}

async function faceOf(canvas, w, h) {
  const faces = await detectFaces(canvas);
  if (faces == null) return { faceCount: null };
  if (!faces.length) return { faceCount: 0 };
  const box = faces[0];
  return {
    faceCount: faces.length,
    faceRatio: box.height / h,
    eyeLine: (box.y + box.height * 0.4) / h,
    faceCenterX: (box.x + box.width / 2) / w,
    box,
  };
}

function framingScore({ faceCount, faceRatio, eyeLine, faceCenterX }) {
  if (faceCount == null) return null;
  if (faceCount === 0) return 10;
  if (faceCount > 1) return 25;
  let s = 100;
  if (faceRatio < 0.22) s -= Math.min(50, Math.round((0.22 - faceRatio) * 250));
  if (faceRatio > 0.6) s -= Math.min(30, Math.round((faceRatio - 0.6) * 150));
  if (eyeLine > 0.5) s -= Math.min(25, Math.round((eyeLine - 0.5) * 100));
  if (eyeLine < 0.2) s -= 15;
  if (Math.abs(faceCenterX - 0.5) > 0.18) s -= 15;
  return Math.max(0, s);
}

function lightingScore({ brightness, contrast, sharpness }) {
  let s = 100;
  if (brightness < 80) s -= Math.min(35, Math.round((80 - brightness) * 0.8));
  if (brightness > 190) s -= Math.min(30, Math.round((brightness - 190) * 0.8));
  if (contrast < 35) s -= 20;
  if (contrast > 85) s -= 15;
  if (sharpness < 60) s -= Math.min(35, Math.round((60 - sharpness) * 0.6));
  return Math.max(0, s);
}

/**
 * Measure a photo. Returns numbers only; the page turns them into words.
 * @param {File} file
 */
export async function measurePhoto(file) {
  const { canvas, ctx, w, h, naturalW, naturalH, bitmap } = await toBitmap(file);
  const face = await faceOf(canvas, w, h);
  const sharpness = sharpnessOf(ctx, w, h);
  const { brightness, contrast } = exposureOf(ctx, w, h);
  bitmap.close?.();
  const metrics = {
    width: naturalW,
    height: naturalH,
    sharpness,
    brightness,
    contrast,
    ...face,
  };
  metrics.framingScore = framingScore(face);
  metrics.lightingScore = lightingScore(metrics);
  // A JPEG copy for the server call, capped in size.
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return { metrics, jpegBase64: dataUrl.split(',')[1] };
}
