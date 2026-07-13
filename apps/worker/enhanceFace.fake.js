/**
 * In-memory fake of enhanceFace (same { imageUrl, costUsd } contract). Wired in via
 * USE_FAKE_REPLICATE=1 so a fake run exercises the full
 * generate -> score -> select -> swap -> enhance pipeline without touching Replicate.
 * No-op: returns the image url unchanged.
 */
export async function enhanceFace(imageUrl) {
  return { imageUrl, costUsd: 0.001 };
}
