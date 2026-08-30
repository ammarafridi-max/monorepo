/**
 * In-memory fake of swapFace (same { imageUrl, costUsd } contract). Wired into the
 * worker via USE_FAKE_REPLICATE=1 so a fake run exercises the full
 * generate -> score -> select -> swap pipeline without touching Replicate.
 *
 * A no-op swap: it returns the target url unchanged (the fake has no real face to
 * apply), so delivery still yields the selected set. costUsd is a tiny stub.
 */
export async function swapFace(targetImageUrl, _sourceFaceUrl) {
  return { imageUrl: targetImageUrl, costUsd: 0.001 };
}
