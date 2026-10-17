import { User } from '@travel-suite/picturesk-shared';
import { dbConnect } from '../../../../lib/db';
import { getSession } from '../../../../lib/session';
import { PASSWORD_MIN, hashPassword, verifyPassword } from '../../../../lib/auth';

export async function POST(req) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'You are not signed in' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json().catch(() => ({}));
  if (!newPassword || newPassword.length < PASSWORD_MIN) {
    return Response.json(
      { error: `Use a new password of at least ${PASSWORD_MIN} characters` },
      { status: 400 }
    );
  }

  await dbConnect();
  const user = await User.findById(session.userId);
  if (!user) return Response.json({ error: 'Account not found' }, { status: 404 });

  if (user.passwordHash) {
    if (!currentPassword || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return Response.json({ error: 'Your current password is incorrect' }, { status: 401 });
    }
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  return Response.json({ ok: true, hadPassword: true });
}
