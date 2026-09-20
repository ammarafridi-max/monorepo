import { redirect } from 'next/navigation';
import { User } from '@travel-suite/picturesk-shared';
import { getSession } from '../../../lib/session';
import { dbConnect } from '../../../lib/db';
import { safeNext } from '../../../lib/redirects';
import { needsVerification } from '../../../lib/verification';
import Container from '../../../components/Container';
import VerifyForm from './VerifyForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Verify your email. Picturesk.ai', robots: { index: false, follow: false } };

// Where a password account proves its inbox before its first set. Already
// verified (or an OAuth account) goes straight on to `next`.
export default async function VerifyPage({ searchParams }) {
  const next = safeNext((await searchParams)?.next);
  const session = await getSession();
  if (!session) redirect(`/signup?next=${encodeURIComponent(next)}`);

  await dbConnect();
  const user = await User.findById(session.userId).lean();
  if (!user) redirect(`/signup?next=${encodeURIComponent(next)}`);
  if (!needsVerification(user)) redirect(next);

  return (
    <main className="page">
      <Container size="narrow">
        <p className="eyebrow">One more step</p>
        <h1 className="display">Check your email.</h1>
        <p className="lede muted">
          We sent a six-digit code to <strong>{user.email}</strong>. Type it below and you are in. It works for
          15 minutes.
        </p>
        <VerifyForm next={next} />
      </Container>
    </main>
  );
}
