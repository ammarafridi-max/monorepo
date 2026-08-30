import { redirect } from 'next/navigation';
import { clearSessionCookie } from '../../../../lib/session';

// POST /api/auth/logout -> clear the session and return home. POST (not GET) so a
// stray link or prefetch cannot log someone out.
export async function POST() {
  clearSessionCookie();
  redirect('/');
}
