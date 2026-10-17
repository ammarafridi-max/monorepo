
const REPLICATE_API = 'https://api.replicate.com';

const PULID_USD_PER_SEC = 0.001525;

const DEFAULT_PULID_MODEL =
  'bytedance/flux-pulid:8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b';

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
  return Number.isFinite(w) ? w : 1.2;
}

function mapStatus(s) {
  if (s === 'succeeded') return 'succeeded';
  if (s === 'failed' || s === 'canceled') return 'failed';
  return 'processing';
}

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


export async function startTraining(referenceImageUrl) {
  if (!referenceImageUrl) throw new Error('[pulid] startTraining: a reference image URL is required');
  return { trainingId: referenceImageUrl };
}

export async function pollTraining(trainingId) {
  return { status: 'succeeded', trainedModelVersion: trainingId, costUsd: 0 };
}


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
            output_format: 'png',
          },
        },
        signal,
      }),
    { attempts: 3, timeoutMs: 60000 }
  );
  return { predictionId: prediction.id };
}

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
