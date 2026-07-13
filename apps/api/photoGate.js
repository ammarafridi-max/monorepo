/**
 * Strict photo screen for the upload gate. The yolov8 detector (faceDetector.js)
 * answers "is there exactly one, big-enough face?" but not the human-judgment rules
 * a good training set needs -- no sunglasses, no hats, in focus, well lit. Those are
 * what a disciplined gate (Aragon-style) enforces, and they are what separates a set
 * the model can learn a face from.
 *
 * We ask a vision-language model (Qwen2-VL) for the SINGLE biggest problem with each
 * photo, as one word, and map it to a branded reason. Validated: it returns "none"
 * for a clean selfie and "sunglasses" for a sunglasses shot.
 *
 * Reuses REPLICATE_API_TOKEN. Model pinned + env-overridable via
 * UPLOAD_PHOTO_GATE_MODEL. Non-fatal by design: a screen error returns { issue:null }
 * (the yolov8 gate + moderation still apply), so a flaky VLM call never blocks a
 * genuinely good photo.
 */

const REPLICATE_API = 'https://api.replicate.com';
const DEFAULT_MODEL_VERSION =
  'bf57361c75677fc33d480d0c5f02926e621b2caa2000347cb74aeae9d2ca07ee'; // lucataco/qwen2-vl-7b-instruct

// Deliberately LENIENT: most everyday photos are fine. We only reject the two
// unambiguous, training-wrecking cases (dark sunglasses hiding the eyes, a hat
// covering the head). Subjective calls (blurry / dark / "too far") caused good
// photos to be rejected, so they are intentionally NOT screened here -- face
// detection already handles framing, and mild softness/lighting is acceptable.
const PROMPT =
  'You are screening a photo for an AI headshot, and you should be LENIENT: most ' +
  'everyday photos are acceptable. Reply with exactly one word. Say "sunglasses" ' +
  'ONLY if the person clearly wears dark tinted glasses that hide the eyes. Say ' +
  '"hat" ONLY if a hat or cap clearly covers the head. Otherwise say "none". ' +
  'Ordinary lighting, minor blur, and clear prescription glasses are all fine.';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function token() {
  const t = process.env.REPLICATE_API_TOKEN;
  if (!t) throw new Error('[photoGate] REPLICATE_API_TOKEN is required');
  return t;
}
function modelVersion() {
  const m = process.env.UPLOAD_PHOTO_GATE_MODEL || DEFAULT_MODEL_VERSION;
  return m.includes(':') ? m.split(':').pop() : m;
}

/** Map the model's one-word answer to a canonical issue id (or null = fine). */
function toIssue(text) {
  const a = String(text || '').toLowerCase();
  if (a.includes('sunglass')) return 'sunglasses';
  if (a.includes('hat') || a.includes('cap')) return 'hat';
  if (a.includes('blur')) return 'blurry';
  if (a.includes('dark') || a.includes('dim')) return 'dark';
  if (a.includes('far') || a.includes('small')) return 'far';
  if (a.includes('group') || a.includes('multiple') || a.includes('people')) return 'group';
  return null; // "none" / "ok" / unrecognized -> not a strict-gate failure
}

/** fetch() to Replicate that waits out 429s / 5xx (the gate fires several at once). */
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
      await sleep(waitMs + 250);
    } catch (err) {
      lastErr = err;
      if (attempt === attempts) throw err;
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw lastErr;
}

/**
 * Assess one image URL for strict-gate issues.
 * @param {string} url
 * @returns {Promise<{ issue: 'sunglasses'|'hat'|'blurry'|'dark'|'far'|'group'|null }>}
 */
export async function assessPhoto(url) {
  const res = await replicateFetch(`${REPLICATE_API}/v1/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=60',
    },
    body: JSON.stringify({
      version: modelVersion(),
      input: { media: url, prompt: PROMPT, max_new_tokens: 5 },
    }),
  });
  let pred = await res.json();
  if (!res.ok) throw new Error(`replicate ${res.status}: ${JSON.stringify(pred)}`);

  const terminal = new Set(['succeeded', 'failed', 'canceled']);
  const deadline = Date.now() + 90_000;
  while (pred.status && !terminal.has(pred.status)) {
    if (Date.now() > deadline) throw new Error('photo screen timed out');
    await sleep(1500);
    const g = await replicateFetch(`${REPLICATE_API}/v1/predictions/${pred.id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    pred = await g.json();
  }
  if (pred.status !== 'succeeded') throw new Error(`photo screen ${pred.status}: ${pred.error ?? '?'}`);

  const text = Array.isArray(pred.output) ? pred.output.join('') : pred.output;
  return { issue: toIssue(text) };
}
