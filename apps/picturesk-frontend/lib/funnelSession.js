import 'server-only';
import { Order, User } from '@travel-suite/picturesk-shared';
import { TIERS, isFreeTier } from '@travel-suite/picturesk-shared/pricing';
import { dbConnect } from './db';
import { getSession } from './session';
import { needsVerification } from './verification';

const FREE_TIER_IDS = TIERS.filter(isFreeTier).map((t) => t.id);
const MODEL_REUSE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

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
  const [freeUsed, source] = await Promise.all([
    Order.exists({ userId: user._id, tier: { $in: FREE_TIER_IDS } }),
    Order.findOne({
      userId: user._id,
      'replicate.trainedModelVersion': { $exists: true, $ne: null },
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .select('_id createdAt uploadedImageUrls')
      .lean(),
  ]);

  return {
    email: user.email,
    freeUsed: Boolean(freeUsed),
    reusable: source
      ? {
          orderId: source._id.toString(),
          date: new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(
            new Date(source.createdAt)
          ),
          count: source.uploadedImageUrls?.length ?? 0,
        }
      : null,
  };
}
