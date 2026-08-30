/**
 * Identity-lock via FACE SWAP (Phase 5 quality step).
 *
 *   swapFace(targetImageUrl, sourceFaceUrl) -> { imageUrl, costUsd }
 *
 * Swaps the customer's REAL face (sourceFaceUrl, one of their uploaded selfies)
 * onto a generated headshot (targetImageUrl), returning the swapped image URL.
 *
 * Why this exists: the trained LoRA reproduces the customer "from memory", so it
 * drifts on the things it cannot lock -- face SHAPE (elongated), hair length, and
 * expression (it invents a teeth smile from the base model's headshot prior).
 * Culling can't catch these (ArcFace identity is invariant to expression/hair), so
 * the delivered set is "close but not them". Swapping the real face onto the final
 * shot fixes geometry/hair/expression directly, because those pixels ARE the
 * customer. The generated image still provides the pose, outfit, lighting and
 * background; only the face is replaced.
 *
 * Injectable, same shape as replicateClient.js / scoreIdentity.js, so the pipeline
 * can stub it in tests. Reuses REPLICATE_API_TOKEN (no new credential).
 *
 * MODEL CONFIG: point REPLICATE_FACE_SWAP_MODEL at a face-swap model on Replicate
 * as "owner/name:versionHash". It must accept { swap_image (the source face),
 * input_image (the target) } and return the swapped image as a URL (string, or a
 * one-element array). Kept in env, not pinned in code, because the right model is
 * an operational choice and slugs churn.
 *
 * Robustness: a swap that FAILS at the content level (e.g. no detectable face in a
 * particular generated shot) falls back to the ORIGINAL target url, so that one
 * image ships un-swapped instead of failing the whole order. Transient/network
 * errors retry and, on exhaustion, throw so the selection step re-runs the swap for
 * the still-unswapped slot on the next job attempt.
 */

const REPLICATE_API = 'https://api.replicate.com';

// GPU inference rate, same basis as the generation estimate in replicateClient.js.
// Only used for computeCostCents margin telemetry.
const SWAP_USD_PER_SEC = 0.001;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function apiToken() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('[swapFace] REPLICATE_API_TOKEN is required');
  return token;
}

function swapModel() {
  const model = process.env.REPLICATE_FACE_SWAP_MODEL;
  if (!model || !/^[^/]+\/[^:]+:.+$/.test(model)) {
    throw new Error(
      '[swapFace] REPLICATE_FACE_SWAP_MODEL must be set as "owner/name:versionHash" (a face-swap model)'
    );
  }
  return model;
}

/** Pull the swapped image URL out of the model output (string or [string]). */
function extractUrl(output) {
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && typeof output[0] === 'string') return output[0];
  return null;
}

/**
 * Swap one face. Starts with `Prefer: wait` so a warm model settles in the POST,
 * then polls to a terminal state (the model can cold boot for a minute or two).
 *
 * @param {string} targetImageUrl - the generated headshot to place the face on
 * @param {string} sourceFaceUrl  - the customer's real selfie (the face to use)
 * @returns {Promise<{ imageUrl: string, costUsd: number }>}
 */
export async function swapFace(
  targetImageUrl,
  sourceFaceUrl,
  { attempts = 4, baseDelayMs = 1000, pollMs = 3000 } = {}
) {
  const versionHash = swapModel().split(':').pop();
  const headers = {
    Authorization: `Bearer ${apiToken()}`,
    'Content-Type': 'application/json',
  };
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(`${REPLICATE_API}/v1/predictions`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'wait=60' },
        body: JSON.stringify({
          version: versionHash,
          input: { swap_image: sourceFaceUrl, input_image: targetImageUrl },
        }),
        signal: AbortSignal.timeout(70000),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const err = new Error(`face-swap start -> ${res.status} ${res.statusText}: ${text}`);
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
        if (!poll.ok) throw new Error(`face-swap poll -> ${poll.status} ${poll.statusText}`);
        body = await poll.json();
      }
      const costUsd =
        typeof body.metrics?.predict_time === 'number'
          ? body.metrics.predict_time * SWAP_USD_PER_SEC
          : 0;
      if (body.status === 'succeeded') {
        const imageUrl = extractUrl(body.output);
        // A "succeeded" run with no usable url, or a content-level failure, means the
        // swap could not be applied to THIS shot (e.g. no face found). Ship it
        // un-swapped rather than failing the order.
        return { imageUrl: imageUrl || targetImageUrl, costUsd };
      }
      if (body.status === 'failed' || body.status === 'canceled') {
        return { imageUrl: targetImageUrl, costUsd };
      }
      throw new Error(`face-swap prediction ${body.id} stuck in status ${body.status}`);
    } catch (err) {
      lastErr = err;
      if (attempt === attempts) break;
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw new Error(`[swapFace] face-swap failed after ${attempts} attempts: ${lastErr.message}`);
}
