import { User } from '@picturesk/shared';
import { dbConnect } from '../../../../lib/db';
import { getSession } from '../../../../lib/session';
import { PASSWORD_MIN, hashPassword, verifyPassword } from '../../../../lib/auth';

/**
 * POST /api/account/password { currentPassword?, newPassword }
 *
 * Change the signed-in user's password, or SET one for the first time on a
 * social-only account (which has no passwordHash yet). Session-gated: the caller
 * must already be authenticated, and if the account already has a password the
 * current one must be provided and match. The session cookie is httpOnly +
 * SameSite=Lax, so a cross-site POST cannot carry it (same CSRF posture as the
 * other auth routes).
 */
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

  // An account that already has a password must confirm the current one. A
  // social-only account (no passwordHash) is setting a password for the first
  // time, so there is nothing to verify beyond the valid session.
  if (user.passwordHash) {
    if (!currentPassword || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return Response.json({ error: 'Your current password is incorrect' }, { status: 401 });
    }
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  return Response.json({ ok: true, hadPassword: true });
}
