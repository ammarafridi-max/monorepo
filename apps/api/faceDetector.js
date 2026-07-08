import { RekognitionClient, DetectFacesCommand } from '@aws-sdk/client-rekognition';
import sharp from 'sharp';

/**
 * Server-side face detection for the upload quality gate.
 *
 * Method: AWS Rekognition DetectFaces (a hosted vision call). Tradeoff vs a local
 * ML model: no heavy native ML runtime or model-weight downloads to ship, at the
 * cost of an external dependency + AWS creds and ~a few hundred ms and a fraction
 * of a cent per image. For our volume correctness beats latency, and this is
 * called at most once per checkout attempt. It is intentionally swappable: any
 * provider that returns face count + bounding-box ratios can replace detectFaces.
 *
 * Rekognition returns BoundingBox as fractions of the image (0..1), which is
 * exactly the "face is a reasonable share of the frame" signal we want, so no
 * separate image-dimension bookkeeping is needed.
 */

let client;
function rekognition() {
  // Region + credentials are read from the standard AWS_* env by the SDK.
  client ??= new RekognitionClient({});
  return client;
}

/**
 * Fetch the image from R2 and downscale it. Rekognition's inline-bytes limit is
 * 5MB and phone photos routinely exceed that, so we re-encode to a bounded JPEG
 * (also auto-orienting via EXIF so a rotated selfie is not read sideways).
 */
async function fetchDownscaled(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());
  return sharp(input)
    .rotate()
    .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();
}

/**
 * Detect faces in one image URL.
 * @param {string} url
 * @returns {Promise<{ faceCount: number, maxFaceBoxRatio: number }>}
 */
export async function detectFaces(url) {
  const Bytes = await fetchDownscaled(url);
  const out = await rekognition().send(
    new DetectFacesCommand({ Image: { Bytes }, Attributes: ['DEFAULT'] })
  );
  const faces = out.FaceDetails ?? [];
  const maxFaceBoxRatio = faces.reduce((max, f) => {
    const box = f.BoundingBox ?? {};
    return Math.max(max, box.Width ?? 0, box.Height ?? 0);
  }, 0);
  return { faceCount: faces.length, maxFaceBoxRatio };
}
