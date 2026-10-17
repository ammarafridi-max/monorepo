
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
