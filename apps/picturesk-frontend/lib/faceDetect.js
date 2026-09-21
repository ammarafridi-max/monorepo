// One face detector for the browser, used by the free tools. MediaPipe's
// BlazeFace (short range) runs on wasm in every modern browser, unlike the
// Chromium-only FaceDetector the upload step's pre-check relies on. The 11 MB
// wasm runtime comes from jsDelivr, pinned; the 230 KB model is served from
// /public. Loaded on first use, once per page.

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const MODEL_URL = '/mediapipe/blaze_face_short_range.tflite';

let detectorPromise;

async function detector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const { FilesetResolver, FaceDetector } = await import('@mediapipe/tasks-vision');
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
      return FaceDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.5,
      });
    })().catch((err) => {
      detectorPromise = undefined;
      throw err;
    });
  }
  return detectorPromise;
}

/**
 * Detect faces in an image source (canvas, bitmap, img). Returns boxes in the
 * source's pixel space, largest first, or null when detection is unavailable.
 * @returns {Promise<Array<{x:number,y:number,width:number,height:number}>|null>}
 */
export async function detectFaces(source) {
  try {
    const d = await detector();
    const { detections } = d.detect(source);
    return detections
      .map((det) => det.boundingBox)
      .filter(Boolean)
      .map((b) => ({ x: b.originX, y: b.originY, width: b.width, height: b.height }))
      .sort((a, b) => b.width * b.height - a.width * a.height);
  } catch {
    return null;
  }
}
