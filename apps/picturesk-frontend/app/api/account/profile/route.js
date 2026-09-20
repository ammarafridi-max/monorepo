import { User } from '@travel-suite/picturesk-shared';
import { dbConnect } from '../../../../lib/db';
import { getSession } from '../../../../lib/session';
import { cleanProfile } from '../../../../lib/profile';

// PUT /api/account/profile { gender, ageRange, race, facialHair, build } -> saves
// the funnel's About and Build answers on the account. Empty strings clear a field.
export async function PUT(req) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'You are not signed in' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const profile = cleanProfile(body);
  if (!profile.gender || !profile.ageRange) {
    return Response.json({ error: 'Gender and age range are required' }, { status: 400 });
  }
  await dbConnect();
  await User.updateOne({ _id: session.userId }, { $set: { profile } });
  return Response.json({ ok: true, profile });
}
