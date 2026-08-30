/**
 * In-memory fake of scoreIdentity (same { score, costUsd } contract). Wired into
 * the worker via USE_FAKE_REPLICATE=1 so a local fake run can exercise the full
 * generate -> score -> select pipeline without touching Replicate, the network,
 * or real money.
 *
 * It returns a deterministic pseudo-score derived from the candidate URL so the
 * selection ranking is stable across restarts (the pipeline's crash tests inject
 * their OWN scorer to control the cull precisely; this is only the dev default).
 */

/** Cheap deterministic hash of a string -> [0, 1). No Math.random (stays stable). */
function hashUnit(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export async function scoreIdentity(candidateImageUrl, _referenceImageUrls) {
  return { score: hashUnit(String(candidateImageUrl)), costUsd: 0.001 };
}
