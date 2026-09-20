import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Stepper from '../../../../components/Stepper';
import Container from '../../../../components/Container';
import { FunnelProvider } from '../../../../components/funnel/FunnelContext';
import { loadFunnelSession } from '../../../../lib/funnelSession';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create your headshots. Picturesk.ai', robots: { index: false, follow: false } };

// The funnel is for signed-in, verified accounts: the account keeps the trained
// model and limits the free plan to once. Anyone else is sent to sign up (or
// verify) and returned here.
export default async function GeneratorLayout({ children }) {
  const session = await loadFunnelSession('/ai-headshot-generator/about');
  if (session.redirectTo) redirect(session.redirectTo);

  return (
    <main className="page generator">
      <Container size="narrow">
        <Suspense fallback={null}>
          <FunnelProvider product="headshots" email={session.email} profile={session.profile} freeUsed={session.freeUsed} reusable={session.reusable}>
            <Stepper />
            {children}
          </FunnelProvider>
        </Suspense>
      </Container>
    </main>
  );
}
