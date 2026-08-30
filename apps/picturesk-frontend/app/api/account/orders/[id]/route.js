import { Order } from '@travel-suite/picturesk-shared';
import { dbConnect } from '../../../../../lib/db';
import { getSession } from '../../../../../lib/session';

/**
 * DELETE /api/account/orders/[id]  ->  DEV ONLY.
 *
 * Delete ONE of the signed-in user's order records, by id and only if it belongs to
 * them, so a developer can prune their own test orders one at a time. HARD-GATED to
 * NODE_ENV === 'development' on the server (the per-row button is dev-only too), so
 * it can never run in production. Removes the Order document only; it does not touch
 * R2-stored photos (that cleanup lives in the admin/Express delete path).
 */
export async function DELETE(_req, { params }) {
  const { id } = await params;
  if (process.env.NODE_ENV !== 'development') {
    return Response.json({ error: 'Not available' }, { status: 403 });
  }
  const session = await getSession();
  if (!session) return Response.json({ error: 'You are not signed in' }, { status: 401 });

  await dbConnect();
  const { deletedCount } = await Order.deleteOne({ _id: id, userId: session.userId });
  if (!deletedCount) return Response.json({ error: 'Order not found' }, { status: 404 });
  return Response.json({ ok: true });
}
