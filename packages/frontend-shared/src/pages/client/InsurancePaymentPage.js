import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import InsuranceLayout from '../../layouts/InsuranceLayout';
import PaymentSuccess from '../../components/v1/PaymentSuccess';

export default function InsurancePaymentPage() {
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
