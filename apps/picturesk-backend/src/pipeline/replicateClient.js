
const REPLICATE_API = 'https://api.replicate.com';

const TRAINER_MODEL = 'ostris/flux-dev-lora-trainer';
const DEFAULT_TRAINER_VERSION =
  'd995297071a44dcb72244e6c19462111649ec86a9646c32df56daa7f14801944';

export const TRIGGER_WORD = 'HDLNRZ';

const TRAINING_USD_PER_SEC = 0.001525;
const GENERATION_USD_PER_SEC = 0.001525;

export function defaultLoraScale() {
  const raw = parseFloat(process.env.GEN_LORA_SCALE);
  return Number.isFinite(raw) ? raw : 1.0;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(label, fn, { attempts = 4, baseDelayMs = 1000, timeoutMs = 30000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(AbortSignal.timeout(timeoutMs));
    } catch (err) {
      lastErr = err;
      if (attempt === attempts) break;
      const backoff = baseDelayMs * 2 ** (attempt - 1);
      const delay = err.status === 429 && err.retryAfterMs ? err.retryAfterMs + 500 : backoff;
      console.warn(
        `[replicate] ${label} attempt ${attempt}/${attempts} failed (${err.message}); retrying in ${delay}ms`
      );
      await sleep(delay);
    }
  }
  const err = new Error(`[replicate] ${label} failed after ${attempts} attempts: ${lastErr.message}`);
  err.status = lastErr.status;
  throw err;
}

function apiToken() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('[replicate] REPLICATE_API_TOKEN is required');
  return token;
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
  if (res.status === 204) return null;
  return res.json();
}

function mapStatus(status) {
  switch (status) {
    case 'succeeded':
      return 'succeeded';
    case 'failed':
    case 'canceled':
      return 'failed';
    default:
      return 'processing';
  }
}

function estimateCostUsd(predictTimeSec, ratePerSec) {
  if (typeof predictTimeSec !== 'number') return undefined;
  return predictTimeSec * ratePerSec;
}

function trainerVersion() {
  return process.env.REPLICATE_TRAINER_VERSION || DEFAULT_TRAINER_VERSION;
}

function destinationModel() {
  const dest = process.env.REPLICATE_DESTINATION_MODEL;
  if (!dest || !dest.includes('/')) {
    throw new Error(
      '[replicate] REPLICATE_DESTINATION_MODEL must be set as "owner/name" (the model trainings push versions to)'
    );
  }
  return dest;
}

async function ensureDestinationModel() {
  const [owner, name] = destinationModel().split('/');
  try {
    await replicateFetch('/v1/models', {
      method: 'POST',
      body: {
        owner,
        name,
        visibility: 'private',
        hardware: process.env.REPLICATE_DESTINATION_HARDWARE || 'gpu-t4',
      },
      signal: AbortSignal.timeout(30000),
    });
    console.log(`[replicate] created destination model ${owner}/${name}`);
  } catch (err) {
    if (/already exists/i.test(err.message) || /-> 4(09|22)\b/.test(err.message)) {
      return; 
    }
    throw err;
  }
}

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
    { attempts: 3, timeoutMs: 60000 }
  );
  return { trainingId: training.id };
}

export async function pollTraining(trainingId) {
  const t = await withRetry(
    'pollTraining',
    (signal) => replicateFetch(`/v1/trainings/${trainingId}`, { signal }),
    { attempts: 8, timeoutMs: 15000 }
  );
  const status = mapStatus(t.status);
  const trainedModelVersion = status === 'succeeded' ? t.output?.version : undefined;
  const weightsUrl = status === 'succeeded' ? t.output?.weights : undefined;
  return {
    status,
    allocated: Boolean(t.started_at),
    trainedModelVersion,
    weightsUrl,
    costUsd: estimateCostUsd(t.metrics?.predict_time, TRAINING_USD_PER_SEC),
  };
}

export async function deleteTrainedModel(modelVersion) {
  const [model, hash] = String(modelVersion).split(':');
  if (!model || !hash) return;
  try {
    await withRetry(
      'deleteTrainedModel',
      (signal) => replicateFetch(`/v1/models/${model}/versions/${hash}`, { method: 'DELETE', signal }),
      { attempts: 2, timeoutMs: 15000 }
    );
  } catch (err) {
    if (err.status === 404) return;
    throw err;
  }
}

export async function cancelTraining(trainingId) {
  await withRetry(
    'cancelTraining',
    (signal) => replicateFetch(`/v1/trainings/${trainingId}/cancel`, { method: 'POST', signal }),
    { attempts: 2, timeoutMs: 15000 }
  );
}

export async function startGeneration(modelVersion, prompt, loraScale = defaultLoraScale()) {
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

export async function pollGeneration(predictionId) {
  const p = await withRetry(
    'pollGeneration',
    (signal) => replicateFetch(`/v1/predictions/${predictionId}`, { signal }),
    { attempts: 8, timeoutMs: 15000 }
  );
  const status = mapStatus(p.status);
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
