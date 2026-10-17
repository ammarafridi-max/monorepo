
const REPLICATE_API = 'https://api.replicate.com';

const EMBED_USD_PER_SEC = 0.0001;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

function extractEmbedding(output) {
  if (Array.isArray(output) && output.every((n) => typeof n === 'number')) return output;
  if (Array.isArray(output?.embedding)) return output.embedding;
  if (Array.isArray(output) && Array.isArray(output[0]?.embedding)) return output[0].embedding;
  if (Array.isArray(output) && Array.isArray(output[0])) return output[0];
  return null;
}

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

async function embedReference(url) {
  if (referenceEmbeddingCache.has(url)) {
    return { embedding: referenceEmbeddingCache.get(url), costUsd: 0 };
  }
  const { embedding, costUsd } = await embed(url);
  referenceEmbeddingCache.set(url, embedding);
  return { embedding, costUsd };
}

export async function scoreIdentity(candidateImageUrl, referenceImageUrls) {
  const references = (referenceImageUrls ?? []).filter(Boolean);
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

  return { score: (best + 1) / 2, costUsd };
}
