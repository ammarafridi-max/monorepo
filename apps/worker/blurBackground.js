import { createStorage } from '@picturesk/shared';
import sharp from 'sharp';

/**
 * Background blur (the "photographer look", Phase 5 polish).
 *
 *   createBackgroundBlurrer() -> blurBackground(sourceUrl, keyBase)
 *                                  -> { imageUrl, costUsd }
 *
 * A strong subject LoRA (we run at lora_scale 1.15 for likeness) overpowers any
 * prompt-level depth-of-field, so generated backgrounds come out sharp and the
 * framing reads like a selfie. Rather than weaken the LoRA (which softened the
 * face in testing), we add the blur AFTER generation, decoupled from the model:
 * matte the subject, blur the original as the background, and composite the sharp
 * subject back on top. Identity is untouched -- the subject pixels are the
 * generated ones, only the background changes.
 *
 * Injectable + resumable, same shape as swapFace / enhanceFace / persistImage: the
 * pipeline treats it as one more per-slot stage (blurredImageUrls). Reuses
 * REPLICATE_API_TOKEN and the worker's R2 storage.
 *
 * COSMETIC + NON-FATAL: any failure (matte error, bad output, network) ships the
 * ORIGINAL image un-blurred rather than failing the order. Blur is a nice-to-have;
 * it must never cost a customer their delivery.
 *
 * MODEL: REPLICATE_MATTE_MODEL ("owner/name:versionHash"), a background-removal /
 * matting model that returns a cutout of the subject on a transparent background
 * (e.g. a rembg / BiRefNet / RMBG style model). Tune blur with BLUR_SIGMA.
 */

const REPLICATE_API = 'https://api.replicate.com';
// GPU inference rate, same basis as the generation/enhance estimates. Telemetry only.
const MATTE_USD_PER_SEC = 0.001;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function apiToken() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('[blurBackground] REPLICATE_API_TOKEN is required');
  return token;
}
function matteVersion() {
  const model = process.env.REPLICATE_MATTE_MODEL;
  if (!model || !/^[^/]+\/[^:]+:.+$/.test(model)) {
    throw new Error('[blurBackground] REPLICATE_MATTE_MODEL must be "owner/name:versionHash"');
  }
  return model.split(':').pop();
}
function floatEnv(name, fallback) {
  const v = parseFloat(process.env[name]);
  return Number.isFinite(v) ? v : fallback;
}

// Matte models return the cutout URL in a few shapes: a bare string, a [url], or a
// nested object ({ image }/{ output }/{ rgba }). Normalise to the first url string.
function firstUrl(output) {
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) return output.find((x) => typeof x === 'string') || null;
  if (output && typeof output === 'object') {
    for (const k of ['image', 'output', 'cutout', 'rgba', 'mask']) {
      if (typeof output[k] === 'string') return output[k];
    }
  }
  return null;
}

async function fetchBuffer(url, timeoutMs = 60000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Run the matte model on one image. Returns the subject-cutout URL (or null on a
 * content-level failure, so the caller ships the original). Transient errors retry
 * with backoff, then throw (caught by blurBackground's non-fatal wrapper).
 */
async function runMatte(imageUrl, { attempts, baseDelayMs, pollMs }) {
  const versionHash = matteVersion();
  const headers = { Authorization: `Bearer ${apiToken()}`, 'Content-Type': 'application/json' };
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(`${REPLICATE_API}/v1/predictions`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'wait=60' },
        body: JSON.stringify({ version: versionHash, input: { image: imageUrl } }),
        signal: AbortSignal.timeout(70000),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const err = new Error(`matte start -> ${res.status} ${res.statusText}: ${text}`);
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
        if (!poll.ok) throw new Error(`matte poll -> ${poll.status} ${poll.statusText}`);
        body = await poll.json();
      }
      const costUsd =
        typeof body.metrics?.predict_time === 'number'
          ? body.metrics.predict_time * MATTE_USD_PER_SEC
          : 0;
      if (body.status === 'succeeded') return { cutoutUrl: firstUrl(body.output), costUsd };
      if (body.status === 'failed' || body.status === 'canceled') return { cutoutUrl: null, costUsd };
      throw new Error(`matte prediction ${body.id} stuck in status ${body.status}`);
    } catch (err) {
      lastErr = err;
      if (attempt === attempts) break;
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw new Error(`[blurBackground] matte failed after ${attempts} attempts: ${lastErr.message}`);
}

export function createBackgroundBlurrer() {
  const storage = createStorage();
  // sharp's Gaussian sigma. ~14 gives a natural portrait bokeh; raise for more blur.
  const sigma = floatEnv('BLUR_SIGMA', 14);

  /**
   * @param {string} sourceUrl - the image to blur the background of
   * @param {string} keyBase   - R2 key WITHOUT extension, e.g. "blurred/<orderId>/<i>"
   * @returns {Promise<{ imageUrl: string, costUsd: number }>}
   */
  return async function blurBackground(sourceUrl, keyBase, opts = {}) {
    const { attempts = 4, baseDelayMs = 1000, pollMs = 3000 } = opts;
    try {
      // 1. matte the subject.
      const { cutoutUrl, costUsd } = await runMatte(sourceUrl, { attempts, baseDelayMs, pollMs });
      if (!cutoutUrl) return { imageUrl: sourceUrl, costUsd }; // no cutout -> ship original

      // 2. composite: blur the original as the background, lay the sharp subject
      //    cutout back on top (aligned, same size, so there is no ghost/seam).
      const [origBuf, cutoutBuf] = await Promise.all([
        fetchBuffer(sourceUrl),
        fetchBuffer(cutoutUrl),
      ]);
      const meta = await sharp(origBuf).metadata();
      const blurredBg = await sharp(origBuf).blur(sigma).toBuffer();
      const cutout = await sharp(cutoutBuf)
        .resize(meta.width, meta.height, { fit: 'fill' })
        .ensureAlpha()
        .png()
        .toBuffer();
      const out = await sharp(blurredBg)
        .composite([{ input: cutout, blend: 'over' }])
        .jpeg({ quality: 90 })
        .toBuffer();

      // 3. store the result on R2 (intermediate key; the persist stage then copies
      //    it to deliveries/, exactly like it copies the enhance/generation output).
      const imageUrl = await storage.putObject(`${keyBase}.jpg`, out, 'image/jpeg');
      return { imageUrl, costUsd };
    } catch (err) {
      // Cosmetic step: never break the order. Ship the original, un-blurred.
      console.warn(`[blurBackground] ${sourceUrl} -> failed (${err.message}); shipping original`);
      return { imageUrl: sourceUrl, costUsd: 0 };
    }
  };
}
