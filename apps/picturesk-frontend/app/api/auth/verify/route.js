import { User } from '@travel-suite/picturesk-shared';
import { dbConnect } from '../../../../lib/db';
import { getSession } from '../../../../lib/session';
import { confirmVerificationCode } from '../../../../lib/verification';

// POST /api/auth/verify { code } -> marks the signed-in account's email verified.
export async function POST(req) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'You are not signed in' }, { status: 401 });
  const { code } = await req.json().catch(() => ({}));

  await dbConnect();
  const user = await User.findById(session.userId);
  if (!user) return Response.json({ error: 'You are not signed in' }, { status: 401 });
  if (user.emailVerifiedAt) return Response.json({ ok: true });

  if (!(await confirmVerificationCode(user, code))) {
    return Response.json({ error: 'That code is wrong or has expired. Request a new one.' }, { status: 400 });
  }
  return Response.json({ ok: true });
}
