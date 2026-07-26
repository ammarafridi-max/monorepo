import { Order, User } from '@picturesk/shared';
import { dbConnect } from '../../../lib/db';
import { getSession, clearSessionCookie } from '../../../lib/session';

/**
 * DELETE /api/account -> delete the signed-in user's LOGIN and unlink their orders.
 *
 * Session-gated. We unlink the orders first (revert userId to null so they become
 * anonymous again, never orphan-pointed at a deleted id), then remove the User, then
 * clear the session. This removes the account and the ability to sign in; the order
 * records and their stored photos are retained. Full erasure of photos/results is a
 * support request per the Privacy Policy (it needs the R2 cleanup the admin delete
 * does), so we do not do it silently here.
 */
export async function DELETE() {
  const session = await getSession();
  if (!session) return Response.json({ error: 'You are not signed in' }, { status: 401 });

  await dbConnect();
  await Order.updateMany({ userId: session.userId }, { $set: { userId: null } });
  await User.deleteOne({ _id: session.userId });
  clearSessionCookie();
  return Response.json({ ok: true });
}
