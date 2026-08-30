/**
 * Realism enhancement (Phase 5 final polish).
 *
 *   enhanceFace(imageUrl) -> { imageUrl, costUsd }
 *
 * FLUX generation + the face swap leave skin looking smooth/"plastic" and the eyes
 * a little soft -- the tell of an AI headshot. This runs each DELIVERED image
 * through a creative upscaler (philz1337x/clarity-upscaler) at LOW creativity /
 * HIGH resemblance, which adds back natural skin micro-texture (pores, fine lines),
 * beard/hair detail, and sharper eyes, and upscales -- WITHOUT re-generating, so it
 * cannot invent features or age the person (the failure mode competitors get slated
 * for). Validated: creativity 0.2 / resemblance 0.85 keeps identity; higher drifts.
 *
 * Injectable, same shape as swapFace.js, so the pipeline can stub it in tests.
 * Reuses REPLICATE_API_TOKEN.
 *
 * MODEL: REPLICATE_ENHANCE_MODEL (default a pinned clarity-upscaler). Tune with
 * ENHANCE_CREATIVITY (default 0.2), ENHANCE_RESEMBLANCE (0.85), ENHANCE_SCALE (2).
 * Non-fatal: an enhance that fails ships the ORIGINAL image, never breaks the order.
 */

const REPLICATE_API = 'https://api.replicate.com';
const DEFAULT_ENHANCE_MODEL =
  'philz1337x/clarity-upscaler:dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e';

// GPU inference rate, same basis as the generation estimate. Cost telemetry only.
const ENHANCE_USD_PER_SEC = 0.001;

// Realism-leaning prompt (validated). Steers the upscaler toward photographic skin
// texture + sharp eyes rather than the smooth/painterly default.
const ENHANCE_PROMPT =
  'professional corporate headshot, natural realistic skin with visible pores and ' +
  'fine texture, sharp detailed eyes, photographic, unretouched, high detail';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function apiToken() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('[enhanceFace] REPLICATE_API_TOKEN is required');
  return token;
}
function enhanceVersion() {
  const model = process.env.REPLICATE_ENHANCE_MODEL || DEFAULT_ENHANCE_MODEL;
  if (!/^[^/]+\/[^:]+:.+$/.test(model)) {
    throw new Error('[enhanceFace] REPLICATE_ENHANCE_MODEL must be "owner/name:versionHash"');
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

/**
 * Enhance one delivered image. Low creativity + high resemblance = add texture and
 * eye detail while holding identity. A failure returns the ORIGINAL url so the shot
 * still ships (transient network errors retry, then throw so the step re-runs).
 *
 * @param {string} imageUrl
 * @returns {Promise<{ imageUrl: string, costUsd: number }>}
 */
export async function enhanceFace(imageUrl, { attempts = 4, baseDelayMs = 1000, pollMs = 3000 } = {}) {
  const versionHash = enhanceVersion();
  const headers = { Authorization: `Bearer ${apiToken()}`, 'Content-Type': 'application/json' };
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(`${REPLICATE_API}/v1/predictions`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'wait=60' },
        body: JSON.stringify({
          version: versionHash,
          input: {
            image: imageUrl,
            prompt: ENHANCE_PROMPT,
            creativity: floatEnv('ENHANCE_CREATIVITY', 0.2),
            resemblance: floatEnv('ENHANCE_RESEMBLANCE', 0.85),
            scale_factor: floatEnv('ENHANCE_SCALE', 2),
            dynamic: 6,
            num_inference_steps: 18,
          },
        }),
        signal: AbortSignal.timeout(70000),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const err = new Error(`enhance start -> ${res.status} ${res.statusText}: ${text}`);
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
        if (!poll.ok) throw new Error(`enhance poll -> ${poll.status} ${poll.statusText}`);
        body = await poll.json();
      }
      const costUsd =
        typeof body.metrics?.predict_time === 'number'
          ? body.metrics.predict_time * ENHANCE_USD_PER_SEC
          : 0;
      if (body.status === 'succeeded') {
        return { imageUrl: firstUrl(body.output) || imageUrl, costUsd };
      }
      if (body.status === 'failed' || body.status === 'canceled') {
        // Content-level failure: ship the original rather than failing the order.
        return { imageUrl, costUsd };
      }
      throw new Error(`enhance prediction ${body.id} stuck in status ${body.status}`);
    } catch (err) {
      lastErr = err;
      if (attempt === attempts) break;
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw new Error(`[enhanceFace] enhance failed after ${attempts} attempts: ${lastErr.message}`);
}
