import sharp from 'sharp';
import { createStorage } from '@travel-suite/picturesk-shared';

const REPLICATE_API = 'https://api.replicate.com';
const DEFAULT_SEGMENT_MODEL =
  '851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc';

const SEGMENT_USD_PER_SEC = 0.000225;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function apiToken() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('[blurBackground] REPLICATE_API_TOKEN is required');
  return token;
}

function segmentVersion() {
  const model = process.env.REPLICATE_SEGMENT_MODEL || DEFAULT_SEGMENT_MODEL;
  if (!/^[^/]+\/[^:]+:.+$/.test(model)) {
    throw new Error('[blurBackground] REPLICATE_SEGMENT_MODEL must be "owner/name:versionHash"');
  }
  return model.split(':').pop();
}

function floatEnv(name, fallback) {
  const v = parseFloat(process.env[name]);
  return Number.isFinite(v) ? v : fallback;
}

function firstUrl(output) {
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && typeof output[0] === 'string') return output[0];
  return null;
}

async function fetchBuffer(url, label) {
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`[blurBackground] fetch ${label} -> ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function segment(imageUrl, { attempts, baseDelayMs, pollMs }) {
  const versionHash = segmentVersion();
  const headers = { Authorization: `Bearer ${apiToken()}`, 'Content-Type': 'application/json' };
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(`${REPLICATE_API}/v1/predictions`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'wait=60' },
        body: JSON.stringify({
          version: versionHash,
          input: { image: imageUrl, format: 'png', background_type: 'rgba' },
        }),
        signal: AbortSignal.timeout(70000),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const err = new Error(`segment start -> ${res.status} ${res.statusText}: ${text}`);
        err.status = res.status;
        throw err;
      }
      let body = await res.json();
      const getUrl = body.urls?.get;
      const deadline = Date.now() + 180000;
      while (
        (body.status === 'starting' || body.status === 'processing') &&
        getUrl &&
        Date.now() < deadline
      ) {
        await sleep(pollMs);
        const poll = await fetch(getUrl, { headers, signal: AbortSignal.timeout(30000) });
        if (!poll.ok) throw new Error(`segment poll -> ${poll.status} ${poll.statusText}`);
        body = await poll.json();
      }
      const costUsd =
        typeof body.metrics?.predict_time === 'number'
          ? body.metrics.predict_time * SEGMENT_USD_PER_SEC
          : 0;
      if (body.status === 'succeeded') return { cutoutUrl: firstUrl(body.output), costUsd };
      if (body.status === 'failed' || body.status === 'canceled') {
        return { cutoutUrl: null, costUsd };
      }
      throw new Error(`segment prediction ${body.id} stuck in status ${body.status}`);
    } catch (err) {
      lastErr = err;
      if (attempt === attempts) break;
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw new Error(`[blurBackground] segment failed after ${attempts} attempts: ${lastErr.message}`);
}

export async function compositeBlur(imageBuffer, cutoutBuffer, { strength } = {}) {
  const image = sharp(imageBuffer);
  const { width, height } = await image.metadata();
  const radius = Math.max(4, Math.round((width / 55) * (strength ?? 1)));

  const mask = await sharp(cutoutBuffer)
    .resize(width, height, { fit: 'fill' })
    .ensureAlpha()
    .extractChannel('alpha')
    .median(5)
    .blur(2)
    .toBuffer();

  const base = await image.clone().jpeg({ quality: 95 }).toBuffer();
  const background = await sharp(base).blur(radius).jpeg({ quality: 95 }).toBuffer();
  const subject = await sharp(base)
    .ensureAlpha()
    .joinChannel(mask)
    .png()
    .toBuffer();

  return sharp(background)
    .composite([{ input: subject, blend: 'over' }])
    .jpeg({ quality: 95 })
    .toBuffer();
}

export function createBackgroundBlurrer() {
  const storage = createStorage();

  return async function blurBackground(
    imageUrl,
    keyBase,
    { attempts = 4, baseDelayMs = 1000, pollMs = 2000 } = {}
  ) {
    const { cutoutUrl, costUsd } = await segment(imageUrl, { attempts, baseDelayMs, pollMs });
    if (!cutoutUrl) return { imageUrl, costUsd };

    const [imageBuffer, cutoutBuffer] = await Promise.all([
      fetchBuffer(imageUrl, 'source image'),
      fetchBuffer(cutoutUrl, 'cutout'),
    ]);

    const blurred = await compositeBlur(imageBuffer, cutoutBuffer, {
      strength: floatEnv('BLUR_STRENGTH', 1),
    });
    const stored = await storage.putObject(`${keyBase}.jpg`, blurred, 'image/jpeg');
    return { imageUrl: stored, costUsd };
  };
}
