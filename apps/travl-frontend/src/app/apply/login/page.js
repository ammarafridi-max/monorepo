import { Suspense } from 'react';
import ApplyLoginPage from '@travel-suite/frontend-shared/pages/client/ApplyLoginPage';

export const metadata = {
  title: 'Sign in to your application',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ApplyLoginPage />
    </Suspense>
  );
}
