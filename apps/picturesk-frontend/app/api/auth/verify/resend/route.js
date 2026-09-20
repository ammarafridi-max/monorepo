import { User } from '@travel-suite/picturesk-shared';
import { dbConnect } from '../../../../../lib/db';
import { getSession } from '../../../../../lib/session';
import { issueVerificationCode } from '../../../../../lib/verification';

// POST /api/auth/verify/resend -> a fresh code, at most once a minute.
export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ error: 'You are not signed in' }, { status: 401 });

  await dbConnect();
  const user = await User.findById(session.userId);
  if (!user) return Response.json({ error: 'You are not signed in' }, { status: 401 });
  if (user.emailVerifiedAt) return Response.json({ ok: true, already: true });

  const sent = await issueVerificationCode(user);
  if (!sent) return Response.json({ error: 'We just sent one. Give it a minute, then try again.' }, { status: 429 });
  return Response.json({ ok: true });
}
