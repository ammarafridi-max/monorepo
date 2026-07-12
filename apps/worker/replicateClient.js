/**
 * Thin wrapper around the Replicate HTTP API for Picturesk (Phase 3).
 *
 * We deliberately do NOT use the `replicate` npm SDK: the four calls we need are
 * simple HTTP, and hand-rolling them keeps the failure behaviour explicit. Every
 * external call goes through withRetry(): a bounded per-attempt timeout plus
 * exponential backoff, capped attempts, and on final failure it THROWS so the
 * worker's own BullMQ retry / FAILED path takes over. Nothing here waits for a
 * job to finish; the worker owns the poll loop so each stage stays resumable.
 *
 * Models (slugs change over time; verified against Replicate docs 2026-07):
 *   Trainer:    ostris/flux-dev-lora-trainer  (Flux LoRA subject fine-tune)
 *               https://replicate.com/ostris/flux-dev-lora-trainer
 *   Generation: the trained output version returned by that training, i.e.
 *               "<destination-owner>/<destination-name>:<hash>", which is a
 *               Flux.1[dev] fine-tune runnable via the standard predictions API.
 *
 * The trainer pushes the trained weights as a new version onto a "destination"
 * model that must already exist. We ensure it lazily (create-if-missing) and
 * reuse one destination for every order; each training still yields its own
 * unique version hash, so orders never collide.
 */

const REPLICATE_API = 'https://api.replicate.com';

// Trainer model + pinned version. Version hashes change as the trainer is
// updated; override with REPLICATE_TRAINER_VERSION without a code change.
// Verified current on Replicate docs, 2026-07.
const TRAINER_MODEL = 'ostris/flux-dev-lora-trainer';
const DEFAULT_TRAINER_VERSION =
  'd995297071a44dcb72244e6c19462111649ec86a9646c32df56daa7f14801944';

// The concept token the LoRA is trained against. It must be a non-word so it
// does not collide with real vocabulary, and it must appear in every generation
// prompt to activate the trained face. Keep it in sync with PROMPTS below.
export const TRIGGER_WORD = 'HDLNRZ';

// Rough per-second GPU rates (USD) used ONLY to estimate margin telemetry from
// metrics.predict_time. The source of truth for billing is the Replicate
// invoice; these are for computeCostCents, not accounting. Flux training and
// flux-dev inference both run on H100-class hardware on Replicate.
const TRAINING_USD_PER_SEC = 0.001525;
const GENERATION_USD_PER_SEC = 0.001525;

// The subject anchor. Every prompt leads with this explicit subject descriptor
// right after the trigger word. On a seed where the identity signal is weak, the
// base model's prior can leak through and drift the subject (flip gender, drop
// the beard); naming the subject up front holds it in place. Edit in ONE place.
// (A later phase could derive this per order; for now it is a single constant.)
export const SUBJECT = 'a bearded man';

/**
 * The headshot prompts. One prompt == one output image for now. Every prompt
 * embeds TRIGGER_WORD to activate the trained face, immediately followed by
 * SUBJECT to anchor gender + facial hair. Copy is not user-facing, no BRAND.md
 * concerns here.
 * @type {readonly string[]}
 */
export const PROMPTS = Object.freeze(
  [
    'wearing a tailored navy business suit, seated against a neutral grey studio backdrop, soft key light',
    'business casual in a light blue button-down shirt, standing by a bright office window, natural daylight',
    'crisp LinkedIn-style corporate headshot, charcoal blazer, clean seamless white background, studio lighting',
    'professional outdoor portrait, blurred green park background, warm late-afternoon sunlight, smiling',
    'confident executive in a black turtleneck, dark moody background, dramatic rim lighting',
    'friendly approachable headshot in a grey sweater over a collared shirt, soft neutral beige background',
    'formal portrait in a dark grey three-piece suit, subtle bokeh of a modern office interior behind',
  ].map((look) => `${TRIGGER_WORD}, ${SUBJECT}, ${look}, sharp focus, high detail`)
);

/**
 * Default LoRA strength for generation, read from GEN_LORA_SCALE (float). Sane
 * range is roughly 0.8 to 1.1: higher pulls harder toward the trained identity
 * (helps weak seeds) but too high risks a baked, artifact-prone look. 1.0 is
 * neutral. Read at call time so the tuning script and env changes take effect.
 */
export function defaultLoraScale() {
  const raw = parseFloat(process.env.GEN_LORA_SCALE);
  return Number.isFinite(raw) ? raw : 1.0;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Run one attempt-producing function with a bounded timeout and exponential
 * backoff. The function receives an AbortSignal it must pass to fetch. On the
 * final failed attempt this throws, on purpose: the caller (worker) turns that
 * into a BullMQ retry and, once attempts are exhausted, a FAILED order.
 *
 * @template T
 * @param {string} label - for log/error context
 * @param {(signal: AbortSignal) => Promise<T>} fn
 * @param {{ attempts?: number, baseDelayMs?: number, timeoutMs?: number }} [opts]
 * @returns {Promise<T>}
 */
async function withRetry(label, fn, { attempts = 4, baseDelayMs = 1000, timeoutMs = 30000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(AbortSignal.timeout(timeoutMs));
    } catch (err) {
      lastErr = err;
      if (attempt === attempts) break;
      // On a 429 the server tells us when the window resets; a short exponential
      // backoff would just burn attempts before it clears. Wait the reset window
      // (plus a small buffer) instead.
      const backoff = baseDelayMs * 2 ** (attempt - 1);
      const delay = err.status === 429 && err.retryAfterMs ? err.retryAfterMs + 500 : backoff;
      console.warn(
        `[replicate] ${label} attempt ${attempt}/${attempts} failed (${err.message}); retrying in ${delay}ms`
      );
      await sleep(delay);
    }
  }
  throw new Error(`[replicate] ${label} failed after ${attempts} attempts: ${lastErr.message}`);
}

/** Read the API token at call time (worker loads .env before any call runs). */
function apiToken() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('[replicate] REPLICATE_API_TOKEN is required');
  return token;
}

/**
 * One authenticated Replicate HTTP call. Non-2xx throws with the body attached
 * so withRetry() can log it and callers can pattern-match (e.g. "already exists").
 */
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
    // Honor the server's throttle window on 429. Prefer the Retry-After header,
    // fall back to the JSON body's retry_after (Replicate sends both).
    if (res.status === 429) {
      const header = Number(res.headers.get('retry-after'));
      let bodyRetry;
      try {
        bodyRetry = JSON.parse(text)?.retry_after;
      } catch {
        bodyRetry = undefined;
      }
      err.retryAfterMs = (header || Number(bodyRetry) || 0) * 1000 || undefined;
    }
    throw err;
  }
  return res.json();
}

/** Map Replicate's status vocabulary onto the three states the worker cares about. */
function mapStatus(status) {
  switch (status) {
    case 'succeeded':
      return 'succeeded';
    case 'failed':
    case 'canceled':
      return 'failed';
    default:
      // starting | processing | (anything unknown yet)
      return 'processing';
  }
}

/** Estimate USD cost from GPU seconds. undefined until metrics exist. */
function estimateCostUsd(predictTimeSec, ratePerSec) {
  if (typeof predictTimeSec !== 'number') return undefined;
  return predictTimeSec * ratePerSec;
}

function trainerVersion() {
  return process.env.REPLICATE_TRAINER_VERSION || DEFAULT_TRAINER_VERSION;
}

/**
 * The model that trained weights are pushed to as new versions. Required for the
 * trainer's `destination`. One shared destination for all orders is fine: every
 * training produces its own version hash.
 */
function destinationModel() {
  const dest = process.env.REPLICATE_DESTINATION_MODEL;
  if (!dest || !dest.includes('/')) {
    throw new Error(
      '[replicate] REPLICATE_DESTINATION_MODEL must be set as "owner/name" (the model trainings push versions to)'
    );
  }
  return dest;
}

/**
 * Create the destination model if it does not already exist. Idempotent: an
 * "already exists" response is success, not an error. Not wrapped in withRetry
 * because we want to inspect the status rather than blindly retry a 4xx.
 */
async function ensureDestinationModel() {
  const [owner, name] = destinationModel().split('/');
  try {
    await replicateFetch('/v1/models', {
      method: 'POST',
      body: {
        owner,
        name,
        visibility: 'private',
        // Metadata default only; the trained Flux version runs on its own GPU.
        hardware: process.env.REPLICATE_DESTINATION_HARDWARE || 'gpu-t4',
      },
      signal: AbortSignal.timeout(30000),
    });
    console.log(`[replicate] created destination model ${owner}/${name}`);
  } catch (err) {
    if (/already exists/i.test(err.message) || /-> 4(09|22)\b/.test(err.message)) {
      return; // already there, nothing to do
    }
    throw err;
  }
}

/**
 * 1. Start a fine-tune training on the customer's images. Returns immediately
 *    with the training id; does NOT wait for completion.
 *
 * @param {string} imageZipUrl - publicly reachable zip of the training photos
 * @returns {Promise<{ trainingId: string }>}
 */
export async function startTraining(imageZipUrl) {
  await ensureDestinationModel();
  const training = await withRetry(
    'startTraining',
    (signal) =>
      replicateFetch(`/v1/models/${TRAINER_MODEL}/versions/${trainerVersion()}/trainings`, {
        method: 'POST',
        body: {
          destination: destinationModel(),
          input: {
            input_images: imageZipUrl,
            trigger_word: TRIGGER_WORD,
          },
        },
        signal,
      }),
    // Kicking off a training is a mutation; keep attempts low so a partial
    // success is not started several times. The worker persists the id before
    // polling, so this is only ever called once per order anyway.
    { attempts: 3, timeoutMs: 60000 }
  );
  return { trainingId: training.id };
}

/**
 * 2. Fetch current training status. Does not block.
 *
 * @param {string} trainingId
 * @returns {Promise<{ status: 'processing'|'succeeded'|'failed', trainedModelVersion?: string, costUsd?: number }>}
 */
export async function pollTraining(trainingId) {
  // A status GET normally answers in ~1s, so a stall means a hung/stale socket,
  // not real slowness. Use a short per-attempt timeout (drop and reopen fast) and
  // MANY attempts: a genuinely-running training must not be discarded because
  // polling had a rough patch. Only after all of these fail does the outer poll
  // loop / job retry kick in.
  const t = await withRetry(
    'pollTraining',
    (signal) => replicateFetch(`/v1/trainings/${trainingId}`, { signal }),
    { attempts: 8, timeoutMs: 15000 }
  );
  const status = mapStatus(t.status);
  // On success the trainer returns output.version as "owner/name:hash" -- the
  // runnable trained model we generate from.
  const trainedModelVersion = status === 'succeeded' ? t.output?.version : undefined;
  return {
    status,
    trainedModelVersion,
    costUsd: estimateCostUsd(t.metrics?.predict_time, TRAINING_USD_PER_SEC),
  };
}

/**
 * 3. Start one image generation from the trained model. Returns immediately.
 *
 * @param {string} modelVersion - "owner/name:hash" from pollTraining
 * @param {string} prompt
 * @param {number} [loraScale] - LoRA strength (see defaultLoraScale); defaults
 *        to GEN_LORA_SCALE. Only affects this cheap GENERATING call, never training.
 * @returns {Promise<{ predictionId: string }>}
 */
export async function startGeneration(modelVersion, prompt, loraScale = defaultLoraScale()) {
  // The predictions API takes the bare version hash.
  const versionHash = modelVersion.includes(':') ? modelVersion.split(':').pop() : modelVersion;
  const prediction = await withRetry(
    'startGeneration',
    (signal) =>
      replicateFetch('/v1/predictions', {
        method: 'POST',
        body: {
          version: versionHash,
          input: {
            prompt,
            num_outputs: 1,
            aspect_ratio: '1:1',
            output_format: 'jpg',
            lora_scale: loraScale,
          },
        },
        signal,
      }),
    { attempts: 3, timeoutMs: 60000 }
  );
  return { predictionId: prediction.id };
}

/**
 * 4. Fetch current generation status.
 *
 * @param {string} predictionId
 * @returns {Promise<{ status: 'processing'|'succeeded'|'failed', imageUrl?: string, costUsd?: number }>}
 */
export async function pollGeneration(predictionId) {
  // Same reasoning as pollTraining: short per-attempt timeout, many attempts, so
  // a transient socket stall does not throw away a generation that is running.
  const p = await withRetry(
    'pollGeneration',
    (signal) => replicateFetch(`/v1/predictions/${predictionId}`, { signal }),
    { attempts: 8, timeoutMs: 15000 }
  );
  const status = mapStatus(p.status);
  // Flux returns an array of output URLs; we asked for a single image.
  const imageUrl =
    status === 'succeeded'
      ? Array.isArray(p.output)
        ? p.output[0]
        : p.output
      : undefined;
  return {
    status,
    imageUrl,
    costUsd: estimateCostUsd(p.metrics?.predict_time, GENERATION_USD_PER_SEC),
  };
}
