/**
 * Identity scoring for candidate headshots (Phase 5 quality gate).
 *
 *   scoreIdentity(candidateImageUrl, referenceImageUrls) -> { score, costUsd }
 *
 * A HIGHER score means the candidate looks MORE like the real customer. The
 * pipeline generates extra candidates and uses this score to auto-cull the
 * off-identity seeds before delivery, WITHOUT retraining.
 *
 * Why this exists: the LoRA occasionally produces a seed where the identity
 * signal was weak, so the base model's prior leaks through and drifts the subject
 * (flips gender, drops the beard). Those seeds can look fine in isolation but
 * wrong next to the real selfies. Scoring each candidate against the customer's
 * uploaded selfies makes those failures fall to the bottom and never ship.
 *
 * === Method + tradeoffs ===
 * We compute a FACE EMBEDDING for the candidate and for each uploaded selfie,
 * then take the BEST cosine similarity across the selfies.
 *   - Face embeddings (ArcFace-style) are the standard, cheapest, most robust
 *     identity signal: a fixed-size vector per face, largely invariant to pose,
 *     lighting, background and expression -- exactly the axes our PROMPTS vary.
 *     Cosine distance between two embeddings is a direct "same person?" measure.
 *   - Alternatives considered and rejected:
 *       (a) A VLM/LLM judge ("do these look like the same person?") is far more
 *           expensive per call, non-deterministic, and no more accurate for pure
 *           identity than an embedding distance.
 *       (b) A pairwise face-VERIFICATION model costs one call per
 *           (candidate, reference) pair -- O(candidates * refs) -- versus
 *           embeddings' O(candidates + refs). Embeddings win on cost + latency.
 *   - We take the MAX over references, not the mean: selfies vary in quality and
 *     angle, and a candidate that strongly matches ANY genuine selfie is the same
 *     person. A mean would unfairly penalise a good candidate for one bad selfie.
 *
 * Injectable, same shape as replicateClient.js / its fake, so the pipeline can
 * stub it in tests. Reuses REPLICATE_API_TOKEN (no new credential).
 *
 * MODEL CONFIG: point REPLICATE_FACE_EMBED_MODEL at a face-embedding model on
 * Replicate as "owner/name:versionHash". It must accept an { image } input and
 * return a numeric embedding vector (we parse a plain array, {embedding:[...]},
 * or [{embedding:[...]}]). Kept in env, not pinned in code, because the right
 * embedding model is an operational choice and slugs churn (same reasoning as
 * REPLICATE_TRAINER_VERSION being overridable).
 */

const REPLICATE_API = 'https://api.replicate.com';

// Our face-embed Cog runs on Replicate CPU, not GPU, so use the CPU rate for the
// computeCostCents margin telemetry (the H100 rate would over-report ~15x).
const EMBED_USD_PER_SEC = 0.0001;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Reference-embedding memo, keyed by selfie URL. The same handful of selfies are
 * scored against every candidate of an order, so without this we would re-embed
 * each selfie GENERATE_COUNT times. The embedding of a URL never changes, so a
 * process-lifetime cache is safe; the cost of a cached selfie is counted once
 * (on the call that actually embedded it) and reported as 0 thereafter.
 */
const referenceEmbeddingCache = new Map();

function apiToken() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('[scoreIdentity] REPLICATE_API_TOKEN is required');
  return token;
}

function embedModel() {
  const model = process.env.REPLICATE_FACE_EMBED_MODEL;
  if (!model || !/^[^/]+\/[^:]+:.+$/.test(model)) {
    throw new Error(
      '[scoreIdentity] REPLICATE_FACE_EMBED_MODEL must be set as "owner/name:versionHash" (a face-embedding model)'
    );
  }
  return model;
}

/**
 * Run one embedding prediction to completion and return { embedding, costUsd }.
 * Uses `Prefer: wait` so a fast embedding model settles inside a single request
 * (no worker-owned poll loop needed -- scoring is not a resumable pipeline stage,
 * it is a leaf call the selection step persists the RESULT of). A bounded retry
 * covers transient failures; on exhaustion it throws so selection retries the
 * whole (still-unscored) candidate on the next job attempt.
 */
async function embed(imageUrl, { attempts = 4, baseDelayMs = 1000, timeoutMs = 60000 } = {}) {
  const versionHash = embedModel().split(':').pop();
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(`${REPLICATE_API}/v1/predictions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken()}`,
          'Content-Type': 'application/json',
          // Block until the prediction settles (or ~60s elapses) so we get the
          // embedding back in this one call instead of polling.
          Prefer: 'wait=60',
        },
        body: JSON.stringify({ version: versionHash, input: { image: imageUrl } }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const err = new Error(`embed -> ${res.status} ${res.statusText}: ${text}`);
        err.status = res.status;
        throw err;
      }
      let body = await res.json();
      // The model scales to zero when idle, so the first call of an order can cold
      // boot for minutes (longer than the Prefer: wait window). Poll patiently to a
      // terminal state instead of throwing and burning a whole job retry on boot.
      const getUrl = body.urls?.get;
      const deadline = Date.now() + 300000;
      while (
        (body.status === 'starting' || body.status === 'processing') &&
        getUrl &&
        Date.now() < deadline
      ) {
        await sleep(3000);
        const poll = await fetch(getUrl, {
          headers: { Authorization: `Bearer ${apiToken()}` },
          signal: AbortSignal.timeout(30000),
        });
        if (!poll.ok) throw new Error(`embed poll -> ${poll.status} ${poll.statusText}`);
        body = await poll.json();
      }
      if (body.status !== 'succeeded') {
        throw new Error(`embed prediction ${body.id} status ${body.status}`);
      }
      const embedding = extractEmbedding(body.output);
      if (!embedding) throw new Error(`embed prediction ${body.id} returned no numeric vector`);
      const costUsd =
        typeof body.metrics?.predict_time === 'number'
          ? body.metrics.predict_time * EMBED_USD_PER_SEC
          : undefined;
      return { embedding, costUsd };
    } catch (err) {
      lastErr = err;
      if (attempt === attempts) break;
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw new Error(`[scoreIdentity] embedding failed after ${attempts} attempts: ${lastErr.message}`);
}

/** Pull a flat numeric vector out of the various shapes embedding models return. */
function extractEmbedding(output) {
  if (Array.isArray(output) && output.every((n) => typeof n === 'number')) return output;
  if (Array.isArray(output?.embedding)) return output.embedding;
  if (Array.isArray(output) && Array.isArray(output[0]?.embedding)) return output[0].embedding;
  if (Array.isArray(output) && Array.isArray(output[0])) return output[0];
  return null;
}

/** Cosine similarity of two equal-length vectors, in [-1, 1]. */
function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Embed a reference selfie, memoized; cost is only charged on a cache miss. */
async function embedReference(url) {
  if (referenceEmbeddingCache.has(url)) {
    return { embedding: referenceEmbeddingCache.get(url), costUsd: 0 };
  }
  const { embedding, costUsd } = await embed(url);
  referenceEmbeddingCache.set(url, embedding);
  return { embedding, costUsd };
}

/**
 * Score one candidate against the customer's real selfies.
 *
 * @param {string} candidateImageUrl
 * @param {readonly string[]} referenceImageUrls - the order's uploaded selfies
 * @returns {Promise<{ score: number, costUsd: number }>} score in [0, 1]
 */
export async function scoreIdentity(candidateImageUrl, referenceImageUrls) {
  const references = (referenceImageUrls ?? []).filter(Boolean);
  // No references to compare against: we cannot judge identity, so return a
  // neutral score. Selection then falls back to prompt order (its tie-break),
  // i.e. it degrades to "deliver the first DELIVER_COUNT" rather than crashing.
  if (references.length === 0) return { score: 0, costUsd: 0 };

  let costUsd = 0;
  const candidate = await embed(candidateImageUrl);
  costUsd += candidate.costUsd ?? 0;

  let best = -1;
  for (const url of references) {
    const ref = await embedReference(url);
    costUsd += ref.costUsd ?? 0;
    const sim = cosine(candidate.embedding, ref.embedding);
    if (sim > best) best = sim;
  }

  // Map cosine [-1, 1] onto [0, 1] so downstream consumers see a clean 0..1 score.
  return { score: (best + 1) / 2, costUsd };
}
