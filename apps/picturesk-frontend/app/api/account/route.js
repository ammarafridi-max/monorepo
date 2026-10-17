import { Order, User } from '@travel-suite/picturesk-shared';
import { dbConnect } from '../../../lib/db';
import { getSession, clearSessionCookie } from '../../../lib/session';

export async function DELETE() {
  const session = await getSession();
  if (!session) return Response.json({ error: 'You are not signed in' }, { status: 401 });

  await dbConnect();
  await Order.updateMany({ userId: session.userId }, { $set: { userId: null } });
  await User.deleteOne({ _id: session.userId });
  await clearSessionCookie();
  return Response.json({ ok: true });
}
