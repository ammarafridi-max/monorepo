import { Order } from '@travel-suite/picturesk-shared';
import { dbConnect } from '../../../../lib/db';
import { getSession } from '../../../../lib/session';

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
