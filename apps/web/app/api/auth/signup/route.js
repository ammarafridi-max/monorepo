import { User } from '@headliner/shared';
import { dbConnect } from '../../../../lib/db';
import { createSessionCookie } from '../../../../lib/session';
import {
  PASSWORD_MIN,
  hashPassword,
  normalizeEmail,
  isValidEmail,
  backlinkOrders,
} from '../../../../lib/auth';

// POST /api/auth/signup { email, password } -> creates the account, back-links any
// past anonymous orders that share the email, and starts a session.
export async function POST(req) {
  const { email, password } = await req.json().catch(() => ({}));
  const normalized = normalizeEmail(email);

  if (!isValidEmail(normalized)) {
    return Response.json({ error: 'Enter a valid email address' }, { status: 400 });
  }
  if (!password || password.length < PASSWORD_MIN) {
    return Response.json({ error: `Use a password of at least ${PASSWORD_MIN} characters` }, { status: 400 });
  }

  await dbConnect();
  if (await User.findOne({ email: normalized })) {
    return Response.json({ error: 'An account with this email already exists' }, { status: 409 });
  }

  const user = await User.create({ email: normalized, passwordHash: await hashPassword(password) });
  await backlinkOrders(user._id, normalized);
  await createSessionCookie(user);

  return Response.json({ ok: true });
}
