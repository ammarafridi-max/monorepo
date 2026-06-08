import { Suspense } from 'react';
import Loading from '@/components/Loading';
import PaymentClient from './PaymentClient';

export const metadata = {
  title: 'Payment Status',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://www.emirateslimo.com/payment' },
};

export default function PaymentPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PaymentClient />
    </Suspense>
  );
}
