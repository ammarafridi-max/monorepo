import { Suspense } from 'react';
import SuccessView from './SuccessView';

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="wrap">
          <p className="muted">Loading your order.</p>
        </main>
      }
    >
      <SuccessView />
    </Suspense>
  );
}
