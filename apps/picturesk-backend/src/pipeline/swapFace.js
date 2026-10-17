
const REPLICATE_API = 'https://api.replicate.com';

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

function extractUrl(output) {
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && typeof output[0] === 'string') return output[0];
  return null;
}

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
