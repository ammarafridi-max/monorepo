export function createBackgroundBlurrer() {
  return async function blurBackground(imageUrl) {
    return { imageUrl, costUsd: 0.0002 };
  };
}
