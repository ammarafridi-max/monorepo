import { User } from '@travel-suite/picturesk-shared';
import { dbConnect } from '../../../lib/db';
import { getSession } from '../../../lib/session';
import { needsVerification } from '../../../lib/verification';
import { API_BASE } from '../../../lib/api';

/**
 * POST /api/checkout -> the only way into the api's /checkout. Reads the session,
 * refuses anonymous or unverified accounts, and forwards the body with the user's
 * id and email under the shared internal key. The api trusts the id because only
 * this route holds the key; the browser never learns it.
 */
export async function POST(req) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Sign in to continue' }, { status: 401 });

  const key = process.env.INTERNAL_API_KEY;
  if (!key) return Response.json({ error: 'Checkout is not configured' }, { status: 500 });

  await dbConnect();
  const user = await User.findById(session.userId).lean();
  if (!user) return Response.json({ error: 'Sign in to continue' }, { status: 401 });
  if (needsVerification(user)) return Response.json({ error: 'Verify your email to continue' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const upstream = await fetch(`${API_BASE}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Internal-Key': key },
    body: JSON.stringify({ ...body, email: user.email, userId: user._id.toString() }),
  });
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
  });
}
