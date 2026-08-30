/**
 * In-memory fake of the image persister (same createImagePersister() shape and
 * { imageUrl } contract). Wired in via USE_FAKE_REPLICATE=1 so a fake run
 * exercises the full generate -> select -> swap -> enhance -> persist pipeline
 * without R2 or network. Returns a deterministic pseudo-R2 URL from the key.
 */
export function createImagePersister() {
  return async function persistImage(_sourceUrl, keyBase) {
    return { imageUrl: `https://fake-r2.local/${keyBase}.jpg` };
  };
}
