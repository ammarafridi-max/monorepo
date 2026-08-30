import sharp from 'sharp';

/**
 * Server-side detection for the upload quality gate, via Replicate (reusing the
 * REPLICATE_API_TOKEN we already have; no extra cloud account).
 *
 * Model: ultralytics/yolov8s-worldv2, an open-vocabulary detector, asked for the
 * "person" class. Verified empirically: on a real selfie it returns one person at
 * ~0.94 confidence, and the class "face"/"human face" did NOT localize faces
 * reliably, so we detect the subject instead.
 *
 * TRADEOFF vs a true face-landmark detector (e.g. AWS Rekognition): person
 * detection is reliable for the rules that matter most (zero subjects, or more
 * than one), but the "face too small" rule becomes a SUBJECT-box-size proxy, so a
 * full-body shot with a small face can pass server-side. The browser's native
 * FaceDetector still applies a true face-size check client-side. This detector is
 * swappable: anything returning { faceCount, maxFaceBoxRatio } drops in here.
 */

const REPLICATE_API = 'https://api.replicate.com';
// ultralytics/yolov8s-worldv2, pinned + env-overridable (versions change).
const DEFAULT_FACE_MODEL_VERSION =
  '9d109240fd8fa73c41dbac9c17f651fc4c0b42261c2ec9db3a975a56b704e2b1';
const DETECT_CLASS = 'person';

function token() {
  const t = process.env.REPLICATE_API_TOKEN;
  if (!t) throw new Error('[faceDetector] REPLICATE_API_TOKEN is required');
  return t;
}
function modelVersion() {
  return process.env.REPLICATE_FACE_MODEL_VERSION || DEFAULT_FACE_MODEL_VERSION;
}
function conf() {
  const c = parseFloat(process.env.REPLICATE_FACE_CONF);
  return Number.isFinite(c) ? c : 0.35;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * fetch() to Replicate that survives rate limits and transient blips. The upload
 * gate can fire several detections at once, so a 429 is expected under load and
 * must NOT be mistaken for an unreadable photo. On 429 we wait the server's
 * Retry-After (or retry_after body field); on 5xx / network errors we back off
 * exponentially. Only after the attempts are exhausted does it give up.
 */
async function replicateFetch(
  url,
  options,
  { attempts = 5, baseDelayMs = 1000 } = {},
) {
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status !== 429 && res.status < 500) return res;
      // Retryable status. Read the body once to surface retry_after / an error.
      const text = await res.text().catch(() => '');
      if (attempt === attempts)
        throw new Error(`replicate ${res.status}: ${text}`);
      const header = Number(res.headers.get('retry-after'));
      let bodyRetry;
      try {
        bodyRetry = JSON.parse(text)?.retry_after;
      } catch {
        bodyRetry = undefined;
      }
      const waitMs =
        (header || Number(bodyRetry) || 0) * 1000 ||
        baseDelayMs * 2 ** (attempt - 1);
      console.warn(
        `[faceDetector] replicate ${res.status}, retrying ${attempt}/${attempts} in ${waitMs}ms`,
      );
      await sleep(waitMs + 250);
    } catch (err) {
      lastErr = err;
      if (attempt === attempts) throw err;
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw lastErr;
}

/** Create a prediction (sync via Prefer: wait) and poll if it is not terminal. */
async function runPrediction(imageUrl) {
  const res = await replicateFetch(`${REPLICATE_API}/v1/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
      Prefer: 'wait',
    },
    body: JSON.stringify({
      version: modelVersion(),
      input: {
        image: imageUrl,
        class_names: DETECT_CLASS,
        conf: conf(),
        return_json: true,
      },
    }),
  });
  let pred = await res.json();
  if (!res.ok)
    throw new Error(`replicate ${res.status}: ${JSON.stringify(pred)}`);

  const terminal = new Set(['succeeded', 'failed', 'canceled']);
  const deadline = Date.now() + 90_000;
  while (pred.status && !terminal.has(pred.status)) {
    if (Date.now() > deadline) throw new Error('face detection timed out');
    await sleep(1500);
    const g = await replicateFetch(
      `${REPLICATE_API}/v1/predictions/${pred.id}`,
      {
        headers: { Authorization: `Bearer ${token()}` },
      },
    );
    pred = await g.json();
  }
  if (pred.status !== 'succeeded') {
    throw new Error(
      `face detection ${pred.status}: ${pred.error ?? 'unknown'}`,
    );
  }
  return pred.output;
}

/**
 * Read the image's DISPLAY pixel dimensions (header only) to turn pixel boxes
 * into ratios. The detector operates on the EXIF-oriented image, so for a phone
 * photo stored rotated (orientation 5-8 = a 90/270 turn) we must swap width and
 * height, or the ratio comes out wrong (even above 1.0).
 */
async function imageDimensions(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  const meta = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
  let width = meta.width || 0;
  let height = meta.height || 0;
  if (meta.orientation && meta.orientation >= 5) {
    [width, height] = [height, width];
  }
  return { width, height };
}

// A second person only counts as a distinct SUBJECT if it is a meaningful size
// next to the main subject. Env-overridable. 0.6 = "at least 60% as large as the
// biggest person in frame". This is the key easing: a small bystander in the
// background, or a spurious low box, is far smaller than the subject and so no
// longer trips the "more than one person" rule on an otherwise-solo photo. A
// genuine second subject is a comparable size and still does.
function subjectMinFraction() {
  const f = parseFloat(process.env.UPLOAD_SUBJECT_MIN_FRACTION);
  return Number.isFinite(f) ? f : 0.6;
}

/**
 * Detect subjects in one image URL.
 * @param {string} url
 * @returns {Promise<{ faceCount: number, subjectCount: number, maxFaceBoxRatio: number }>}
 *   faceCount = every person detected (for the "no person" check);
 *   subjectCount = people large enough to be a real subject (for "more than one");
 *   maxFaceBoxRatio = the largest person's box vs the frame (for "too small").
 */
export async function detectFaces(url) {
  const [output, { width, height }] = await Promise.all([
    runPrediction(url),
    imageDimensions(url),
  ]);

  let detections = [];
  try {
    detections = JSON.parse(output?.json_str || '[]');
  } catch {
    detections = [];
  }

  // Boxes are original-image pixels; ratio = box's larger side vs the image.
  const ratios = detections.map((d) => {
    const b = d.box || {};
    const w = Math.abs((b.x2 ?? 0) - (b.x1 ?? 0));
    const h = Math.abs((b.y2 ?? 0) - (b.y1 ?? 0));
    return Math.max(width ? w / width : 0, height ? h / height : 0);
  });
  const maxFaceBoxRatio = ratios.length ? Math.max(...ratios) : 0;

  const threshold = subjectMinFraction() * maxFaceBoxRatio;
  const subjectCount = ratios.filter((r) => r >= threshold).length;

  return { faceCount: detections.length, subjectCount, maxFaceBoxRatio };
}
