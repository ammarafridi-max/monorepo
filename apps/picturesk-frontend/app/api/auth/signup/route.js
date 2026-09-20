import { User } from '@travel-suite/picturesk-shared';
import { dbConnect } from '../../../../lib/db';
import { createSessionCookie } from '../../../../lib/session';
import { issueVerificationCode } from '../../../../lib/verification';
import {
  PASSWORD_MIN,
  hashPassword,
  normalizeEmail,
  isValidEmail,
  backlinkOrders,
} from '../../../../lib/auth';

// POST /api/auth/signup { email, password } -> creates the account, back-links any
// past anonymous orders that share the email, starts a session, and emails a
// verification code. `verify: true` tells the form to go to /verify next.
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
  // A password account proves its inbox before it can start a set; the code is
  // best effort here, the verify page can resend.
  await issueVerificationCode(user).catch((err) => console.error('[web] verification email failed:', err.message));

  return Response.json({ ok: true, verify: true });
}
