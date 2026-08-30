import { Order } from '@travel-suite/picturesk-shared';
import { dbConnect } from '../../../../lib/db';
import { getSession } from '../../../../lib/session';

/**
 * POST /api/orders/link { orderId } -> associate a freshly created order with the
 * logged-in user. Called by the upload form right after checkout. No-op (200) if
 * the visitor is anonymous, so the anonymous flow is unchanged.
 *
 * Safe by construction: it only claims an order whose customerEmail matches the
 * session email AND that has no owner yet, so a guessed order id cannot be used to
 * claim someone else's order.
 */
export async function POST(req) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, reason: 'anonymous' });

  const { orderId } = await req.json().catch(() => ({}));
  if (!orderId) return Response.json({ error: 'orderId is required' }, { status: 400 });

  await dbConnect();
  await Order.updateOne(
    { _id: orderId, customerEmail: session.email, userId: null },
    { $set: { userId: session.userId } }
  );

  return Response.json({ ok: true });
}
