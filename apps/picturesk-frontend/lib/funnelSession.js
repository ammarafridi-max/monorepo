import 'server-only';
import { Order, User } from '@travel-suite/picturesk-shared';
import { TIERS, isFreeTier } from '@travel-suite/picturesk-shared/pricing';
import { dbConnect } from './db';
import { getSession } from './session';
import { needsVerification } from './verification';
import { cleanProfile } from './profile';

const FREE_TIER_IDS = TIERS.filter(isFreeTier).map((t) => t.id);
const MODEL_REUSE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

async function alive(url) {
  if (!url) return false;
  try {
    return (await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(4000) })).ok;
  } catch {
    return false;
  }
}

/**
 * Whether an earlier order still has selfies to reuse: the individual uploads
 * (shown as thumbnails) or, failing that, the training zip the api can restore
 * them from. Returns { images } or null.
 */
async function reusablePhotos(order) {
  const urls = order.uploadedImageUrls ?? [];
  if (urls.length && (await alive(urls[0]))) return { images: urls };
  const zipUrl = urls[0] ? `${new URL(urls[0]).origin}/training/${order._id}.zip` : null;
  if (await alive(zipUrl)) return { images: [] };
  return null;
}

/**
 * What the funnel layout needs about the visitor, in one query pass: where to send
 * them if they cannot be here, whether the free plan is spent, and the most recent
 * order whose trained model is still fresh enough to reuse.
 */
export async function loadFunnelSession(entryPath) {
  const session = await getSession();
  const back = encodeURIComponent(entryPath);
  if (!session) return { redirectTo: `/signup?next=${back}` };

  await dbConnect();
  const user = await User.findById(session.userId).lean();
  if (!user) return { redirectTo: `/signup?next=${back}` };
  if (needsVerification(user)) return { redirectTo: `/verify?next=${back}` };

  const since = new Date(Date.now() - MODEL_REUSE_MAX_AGE_MS);
  const [freeUsed, candidates] = await Promise.all([
    Order.exists({ userId: user._id, tier: { $in: FREE_TIER_IDS } }),
    Order.find({
      userId: user._id,
      'replicate.trainedModelVersion': { $exists: true, $ne: null },
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('_id createdAt uploadedImageUrls')
      .lean(),
  ]);

  // The newest order whose photos still exist somewhere we can get them from.
  let reusable = null;
  for (const source of candidates) {
    const photos = await reusablePhotos(source);
    if (!photos) continue;
    reusable = {
      orderId: source._id.toString(),
      date: new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        new Date(source.createdAt)
      ),
      count: source.uploadedImageUrls?.length ?? 0,
      images: photos.images,
    };
    break;
  }

  return {
    email: user.email,
    profile: cleanProfile(user.profile),
    freeUsed: Boolean(freeUsed),
    reusable,
  };
}
