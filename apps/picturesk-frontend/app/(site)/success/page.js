import { Suspense } from 'react';
import SuccessView from './SuccessView';
import Container from '../../../components/Container';

export const metadata = { title: 'Your order. Picturesk.ai', robots: { index: false, follow: false } };

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="page">
          <Container size="narrow">
            <p className="muted">Loading your order.</p>
          </Container>
        </main>
      }
    >
      <SuccessView />
    </Suspense>
  );
}
