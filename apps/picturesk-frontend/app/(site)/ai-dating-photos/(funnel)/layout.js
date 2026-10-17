import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Stepper from '../../../../components/Stepper';
import Container from '../../../../components/Container';
import { FunnelProvider } from '../../../../components/funnel/FunnelContext';
import { loadFunnelSession } from '../../../../lib/funnelSession';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create your dating photos. Picturesk.ai', robots: { index: false, follow: false } };

export default async function GeneratorLayout({ children }) {
  const session = await loadFunnelSession('/ai-dating-photos/about');
  if (session.redirectTo) redirect(session.redirectTo);

  return (
    <main className="page generator">
      <Container size="narrow">
        <Suspense fallback={null}>
          <FunnelProvider product="dating" email={session.email} profile={session.profile} freeUsed={session.freeUsed} reusable={session.reusable}>
            <Stepper />
            {children}
          </FunnelProvider>
        </Suspense>
      </Container>
    </main>
  );
}
