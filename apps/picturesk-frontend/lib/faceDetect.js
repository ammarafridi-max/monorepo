
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
