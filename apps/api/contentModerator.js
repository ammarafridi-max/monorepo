/**
 * Server-side CONTENT SAFETY for the upload gate. The face detector checks that a
 * usable subject is present; this checks that the image is not unsafe to accept,
 * store, train on, or pay for. It runs at the same boundary (POST /checkout,
 * before any Stripe session exists).
 *
 * METHOD + TRADEOFF: we reuse Replicate (the same REPLICATE_API_TOKEN as the face
 * detector) rather than adding a separate moderation vendor. Reasons: one
 * credential, one failure model already hardened here (retry/backoff), and an
 * image NSFW classifier reliably catches the dominant risk for a headshot upload,
 * which is explicit / sexual imagery. The honest limitation: a general NSFW model
 * is NOT a compliance-grade illegal-content system. True illegal-content handling
 * (e.g. CSAM detection via PhotoDNA / Thorn hash matching) and richer categories
 * (violence, weapons, hate) are what a dedicated service like AWS Rekognition
 * Moderation, Hive, or Google Vision SafeSearch provides. moderateImage() is a
 * swappable interface: replace this one function with any of those and no caller
 * changes. If you need that coverage, do the swap.
 *
 * Interface: moderateImage(url) -> { safe: boolean, score: number|null, reason?: string }
 * Throws only on a hard infrastructure error (unreachable model, unparseable
 * output); the caller decides fail-open vs fail-closed for those.
 */

const REPLICATE_API = 'https://api.replicate.com';

// The moderation model, as "owner/name" (env-overridable). We call it by its
// latest version via the model-predictions endpoint, so there is no version hash
// to keep in sync; pin REPLICATE_MODERATION_MODEL_VERSION if you want it frozen.
const DEFAULT_MODERATION_MODEL = 'falcons-ai/nsfw_image_detection';

// Branded, NON-graphic rejection reason. We never describe what was detected.
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
/**
 * NSFW score above which an image is rejected. Conservative but not paranoid:
 * a normal selfie scores near 0, so 0.85 blocks clearly explicit content without
 * tripping on ordinary photos (beachwear, low necklines, etc.). Env-tunable.
 */
function threshold() {
  const t = parseFloat(process.env.REPLICATE_MODERATION_NSFW_THRESHOLD);
  return Number.isFinite(t) ? t : 0.85;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * fetch() to Replicate that survives rate limits and transient blips. Mirrors the
 * face detector's helper (kept local so this module stays a self-contained,
 * swappable boundary). On 429 waits Retry-After; on 5xx / network errors backs off.
 */
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

/** Run the classifier on one image (sync via Prefer: wait) and return its output. */
async function runModeration(imageUrl) {
  const version = modelVersion();
  // Pinned version -> /v1/predictions with { version }; otherwise run the model's
  // latest version via the model-predictions endpoint (no hash needed).
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

/**
 * Reduce a classifier's output to a single NSFW score in [0,1], tolerating the
 * shapes NSFW models on Replicate return: a bare label string, an array of
 * { label, score|confidence }, or a { label: score } object. Returns null for an
 * unrecognised shape so the caller can treat it as an infrastructure error.
 */
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

/**
 * Moderate one image URL.
 * @param {string} url
 * @returns {Promise<{ safe: boolean, score: number|null, reason?: string }>}
 */
export async function moderateImage(url) {
  const output = await runModeration(url);
  const score = nsfwScoreFrom(output);
  if (score === null) {
    // Unknown output shape: treat as an infrastructure error so the caller's
    // fail-open/closed policy applies, rather than silently passing unsafe input.
    throw new Error('moderation: unrecognised classifier output');
  }
  const safe = score < threshold();
  return { safe, score, reason: safe ? undefined : MODERATION_REASON };
}
