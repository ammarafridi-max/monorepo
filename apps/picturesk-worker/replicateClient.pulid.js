/**
 * PuLID-FLUX generation client (alternate GENERATION_BACKEND).
 *
 * Implements the SAME injected interface as replicateClient.js
 * (startTraining/pollTraining/startGeneration/pollGeneration) so the existing
 * pipeline drives it UNCHANGED -- but there is no per-user LoRA training. Instead,
 * identity comes from a single REFERENCE selfie fed to bytedance/flux-pulid at
 * generation time, which fixes face SHAPE (the thing a LoRA + swap could not) and
 * removes the whole train -> cull -> swap machinery.
 *
 * Adapter trick: the pipeline threads a "trainedModelVersion" from training into
 * generation. Here there is nothing to train, so "training" is a no-op that simply
 * CARRIES THE REFERENCE IMAGE URL forward through that slot: startTraining(ref)
 * returns the ref as the trainingId, pollTraining echoes it as trainedModelVersion,
 * and startGeneration(ref, prompt) uses it as PuLID's main_face_image. The pipeline
 * is none the wiser, so its idempotency/resume guarantees are preserved verbatim.
 *
 * MODEL: PULID_MODEL (default the pinned bytedance/flux-pulid version). Identity
 * strength via PULID_ID_WEIGHT (default 1). Reuses REPLICATE_API_TOKEN.
 */

const REPLICATE_API = 'https://api.replicate.com';

// GPU inference rate, same basis as the generation estimate in replicateClient.js.
// Only used for computeCostCents margin telemetry.
const PULID_USD_PER_SEC = 0.001525;

const DEFAULT_PULID_MODEL =
  'bytedance/flux-pulid:8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b';

// FLUX PuLID (unlike vanilla FLUX) honors a negative prompt, so we use it to kill
// the base model's "headshot = big toothy grin" prior -- the invented-teeth bug.
const NEGATIVE_PROMPT =
  'showing teeth, open mouth, laughing, big grin, cartoon, illustration, 3d render, ' +
  'cgi, plastic skin, deformed, disfigured, extra fingers, blurry, low quality, watermark, text';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function apiToken() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('[pulid] REPLICATE_API_TOKEN is required');
  return token;
}

function pulidVersionHash() {
  const model = process.env.PULID_MODEL || DEFAULT_PULID_MODEL;
  if (!/^[^/]+\/[^:]+:.+$/.test(model)) {
    throw new Error('[pulid] PULID_MODEL must be "owner/name:versionHash"');
  }
  return model.split(':').pop();
}

function idWeight() {
  const w = parseFloat(process.env.PULID_ID_WEIGHT);
  // Default 1.2: 1.0 drifted (short beard, weak shape); ~1.1-1.3 holds identity +
  // face shape without over-baking. Tunable via PULID_ID_WEIGHT.
  return Number.isFinite(w) ? w : 1.2;
}

function mapStatus(s) {
  if (s === 'succeeded') return 'succeeded';
  if (s === 'failed' || s === 'canceled') return 'failed';
  return 'processing';
}

/** Pull the single output image URL out of PuLID's output (array or string). */
function firstUrl(output) {
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && typeof output[0] === 'string') return output[0];
  return undefined;
}

async function replicateFetch(path, { method = 'GET', body, signal } = {}) {
  const res = await fetch(`${REPLICATE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiToken()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`${method} ${path} -> ${res.status} ${res.statusText}: ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function withRetry(label, fn, { attempts = 4, baseDelayMs = 1000, timeoutMs = 30000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fn(controller.signal);
    } catch (err) {
      lastErr = err;
      if (attempt === attempts) break;
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    } finally {
      clearTimeout(t);
    }
  }
  throw new Error(`[pulid] ${label} failed after ${attempts} attempts: ${lastErr.message}`);
}

// === Adapter: "training" is a no-op that carries the reference image forward. ===

/** No real training. Carry the reference selfie URL forward as the trainingId. */
export async function startTraining(referenceImageUrl) {
  if (!referenceImageUrl) throw new Error('[pulid] startTraining: a reference image URL is required');
  return { trainingId: referenceImageUrl };
}

/** Instantly "succeeds", echoing the reference forward as the trainedModelVersion. */
export async function pollTraining(trainingId) {
  return { status: 'succeeded', trainedModelVersion: trainingId, costUsd: 0 };
}

// === Real work: one PuLID generation per candidate, keyed on the reference. ===

/**
 * Start one PuLID generation. `referenceImageUrl` arrives via the pipeline's
 * modelVersion slot (see the adapter note above). Returns immediately with the
 * prediction id; the pipeline polls it in a second pass.
 */
export async function startGeneration(referenceImageUrl, prompt) {
  const prediction = await withRetry(
    'startGeneration',
    (signal) =>
      replicateFetch('/v1/predictions', {
        method: 'POST',
        body: {
          version: pulidVersionHash(),
          input: {
            main_face_image: referenceImageUrl,
            prompt,
            negative_prompt: NEGATIVE_PROMPT,
            id_weight: idWeight(),
            num_outputs: 1,
            num_steps: 20,
            // NOTE: this model's 'jpg' option is broken (it crashes in PIL with
            // KeyError 'JPG'); 'png' and 'webp' work. Use png.
            output_format: 'png',
          },
        },
        signal,
      }),
    { attempts: 3, timeoutMs: 60000 }
  );
  return { predictionId: prediction.id };
}

/** One status check for a PuLID prediction (the pipeline owns the poll loop). */
export async function pollGeneration(predictionId) {
  const p = await withRetry(
    'pollGeneration',
    (signal) => replicateFetch(`/v1/predictions/${predictionId}`, { signal }),
    { attempts: 6, timeoutMs: 15000 }
  );
  const status = mapStatus(p.status);
  return {
    status,
    imageUrl: status === 'succeeded' ? firstUrl(p.output) : undefined,
    costUsd:
      typeof p.metrics?.predict_time === 'number'
        ? p.metrics.predict_time * PULID_USD_PER_SEC
        : undefined,
  };
}
