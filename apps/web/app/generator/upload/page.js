import { Suspense } from 'react';
import UploadStep from './UploadStep';

export default function UploadPage() {
  return (
    <Suspense fallback={<section><p className="muted">Loading your order.</p></section>}>
      <UploadStep />
    </Suspense>
  );
}
