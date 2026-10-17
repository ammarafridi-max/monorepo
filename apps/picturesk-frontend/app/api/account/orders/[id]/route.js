import { Order } from '@travel-suite/picturesk-shared';
import { dbConnect } from '../../../../../lib/db';
import { getSession } from '../../../../../lib/session';

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
