import { User } from '@headliner/shared';
import { dbConnect } from '../../../../lib/db';
import { createSessionCookie } from '../../../../lib/session';
import { verifyPassword, normalizeEmail, backlinkOrders } from '../../../../lib/auth';

// POST /api/auth/login { email, password } -> verifies credentials and starts a
// session. Also back-links any past anonymous orders sharing this email.
export async function POST(req) {
  const { email, password } = await req.json().catch(() => ({}));
  const normalized = normalizeEmail(email);

  await dbConnect();
  const user = await User.findOne({ email: normalized });

  // One generic message whether the email is unknown or the password is wrong, so
  // we do not reveal which emails have accounts.
  if (!user || !(await verifyPassword(password || '', user.passwordHash))) {
    return Response.json({ error: 'Email or password is incorrect' }, { status: 401 });
  }

  await backlinkOrders(user._id, normalized);
  await createSessionCookie(user);

  return Response.json({ ok: true });
}
