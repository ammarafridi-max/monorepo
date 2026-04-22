import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import InsuranceLayout from '@/layouts/InsuranceLayout';
import PaymentSuccess from '@travel-suite/frontend-shared/components/v1/PaymentSuccess';

export const metadata = {
  title: 'Booking Confirmed — TravelShield',
  description: 'Your travel insurance policy has been confirmed.',
};

export default function PaymentPage() {
  return (
    <InsuranceLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 size={28} className="animate-spin text-gray-300" />
          </div>
        }
      >
        <PaymentSuccess />
      </Suspense>
    </InsuranceLayout>
  );
}
