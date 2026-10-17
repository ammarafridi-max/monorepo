
const REPLICATE_API = 'https://api.replicate.com';

const DEFAULT_MODERATION_MODEL = 'falcons-ai/nsfw_image_detection';

export const MODERATION_REASON = 'This photo cannot be used';

function token() {
  const t = process.env.REPLICATE_API_TOKEN;
  if (!t) throw new Error('[contentModerator] REPLICATE_API_TOKEN is required');
  return t;
}
function model() {
  return process.env.REPLICATE_MODERATION_MODEL || DEFAULT_MODERATION_MODEL;
}
function modelVersion() {
  return process.env.REPLICATE_MODERATION_MODEL_VERSION || '';
}
function threshold() {
  const t = parseFloat(process.env.REPLICATE_MODERATION_NSFW_THRESHOLD);
  return Number.isFinite(t) ? t : 0.85;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function replicateFetch(url, options, { attempts = 5, baseDelayMs = 1000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status !== 429 && res.status < 500) return res;
      const text = await res.text().catch(() => '');
      if (attempt === attempts) throw new Error(`replicate ${res.status}: ${text}`);
      const header = Number(res.headers.get('retry-after'));
      let bodyRetry;
      try {
        bodyRetry = JSON.parse(text)?.retry_after;
      } catch {
        bodyRetry = undefined;
      }
      const waitMs = (header || Number(bodyRetry) || 0) * 1000 || baseDelayMs * 2 ** (attempt - 1);
      console.warn(`[contentModerator] replicate ${res.status}, retrying ${attempt}/${attempts} in ${waitMs}ms`);
      await sleep(waitMs + 250);
    } catch (err) {
      lastErr = err;
      if (attempt === attempts) throw err;
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw lastErr;
}

async function runModeration(imageUrl) {
  const version = modelVersion();
  const endpoint = version
    ? `${REPLICATE_API}/v1/predictions`
    : `${REPLICATE_API}/v1/models/${model()}/predictions`;
  const body = version
    ? { version, input: { image: imageUrl } }
    : { input: { image: imageUrl } };

  const res = await replicateFetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
      Prefer: 'wait',
    },
    body: JSON.stringify(body),
  });
  let pred = await res.json();
  if (!res.ok) throw new Error(`replicate ${res.status}: ${JSON.stringify(pred)}`);

  const terminal = new Set(['succeeded', 'failed', 'canceled']);
  const deadline = Date.now() + 90_000;
  while (pred.status && !terminal.has(pred.status)) {
    if (Date.now() > deadline) throw new Error('moderation timed out');
    await sleep(1500);
    const g = await replicateFetch(`${REPLICATE_API}/v1/predictions/${pred.id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    pred = await g.json();
  }
  if (pred.status !== 'succeeded') {
    throw new Error(`moderation ${pred.status}: ${pred.error ?? 'unknown'}`);
  }
  return pred.output;
}

const UNSAFE_LABEL = /nsfw|porn|explicit|sexual|hentai|nude|nudity/;

export function nsfwScoreFrom(output) {
  if (typeof output === 'string') {
    return UNSAFE_LABEL.test(output.toLowerCase()) ? 1 : 0;
  }
  if (Array.isArray(output)) {
    let score = 0;
    let matched = false;
    for (const item of output) {
      const label = String(item?.label ?? item?.class ?? '').toLowerCase();
      const s = Number(item?.score ?? item?.confidence ?? 0);
      if (UNSAFE_LABEL.test(label)) {
        score = Math.max(score, Number.isFinite(s) ? s : 0);
        matched = true;
      } else if (/safe|normal|sfw|neutral/.test(label)) {
        matched = true;
      }
    }
    return matched ? score : null;
  }
  if (output && typeof output === 'object') {
    let score = 0;
    let matched = false;
    for (const [k, v] of Object.entries(output)) {
      if (UNSAFE_LABEL.test(k.toLowerCase())) {
        score = Math.max(score, Number(v) || 0);
        matched = true;
      } else if (/safe|normal|sfw|neutral/.test(k.toLowerCase())) {
        matched = true;
      }
    }
    return matched ? score : null;
  }
  return null;
}

export async function moderateImage(url) {
  const output = await runModeration(url);
  const score = nsfwScoreFrom(output);
  if (score === null) {
    throw new Error('moderation: unrecognised classifier output');
  }
  const safe = score < threshold();
  return { safe, score, reason: safe ? undefined : MODERATION_REASON };
}
