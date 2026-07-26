/**
 * In-memory fake of blurBackground (same { imageUrl, costUsd } contract). Wired in
 * via USE_FAKE_REPLICATE=1 so a fake run exercises the full
 * generate -> score -> select -> swap -> enhance -> blur -> persist pipeline without
 * touching Replicate or R2. No-op: returns the image url unchanged.
 */
export function createBackgroundBlurrer() {
  return async function blurBackground(sourceUrl) {
    return { imageUrl: sourceUrl, costUsd: 0 };
  };
}
