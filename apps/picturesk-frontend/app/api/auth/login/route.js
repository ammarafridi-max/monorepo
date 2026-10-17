import { User } from '@travel-suite/picturesk-shared';
import { dbConnect } from '../../../../lib/db';
import { createSessionCookie } from '../../../../lib/session';
import { verifyPassword, normalizeEmail, backlinkOrders } from '../../../../lib/auth';
import { needsVerification } from '../../../../lib/verification';

export async function POST(req) {
  const { email, password } = await req.json().catch(() => ({}));
  const normalized = normalizeEmail(email);

  await dbConnect();
  const user = await User.findOne({ email: normalized });

  if (!user || !user.passwordHash || !(await verifyPassword(password || '', user.passwordHash))) {
    return Response.json({ error: 'Email or password is incorrect' }, { status: 401 });
  }

  await backlinkOrders(user._id, normalized);
  await createSessionCookie(user);

  return Response.json({ ok: true, verify: needsVerification(user) });
}
