import { redirect } from 'next/navigation';
import {
  getProvider,
  isConfigured,
  exchangeCodeForEmail,
  redirectUri,
  readAndClearStateCookie,
} from '../../../../../../lib/oauth';
import { dbConnect } from '../../../../../../lib/db';
import { createSessionCookie } from '../../../../../../lib/session';
import { findOrCreateOAuthUser, backlinkOrders } from '../../../../../../lib/auth';

// GET /api/auth/oauth/:provider/callback -> finish the flow: verify the CSRF state,
// exchange the code for the account email, upsert the User, back-link any past
// anonymous orders sharing that email, and start the session. Anything wrong (user
// denied consent, missing code, state mismatch, provider error) fails closed to
// login with no session created. redirect() is kept outside the try so its
// internal NEXT_REDIRECT is never swallowed by the catch.
export async function GET(req, { params }) {
  const name = (await params).provider;
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const expectedState = await readAndClearStateCookie();

  if (
    !getProvider(name) ||
    !isConfigured(name) ||
    !code ||
    !returnedState ||
    returnedState !== expectedState
  ) {
    redirect('/login?error=1');
  }

  let user;
  try {
    const email = await exchangeCodeForEmail(name, code, redirectUri(req, name));
    await dbConnect();
    user = await findOrCreateOAuthUser({ email, provider: name });
    await backlinkOrders(user._id, user.email);
    await createSessionCookie(user);
  } catch {
    redirect('/login?error=1');
  }

  redirect('/account');
}
