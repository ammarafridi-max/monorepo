import InsuranceLayout from '@travel-suite/frontend-shared/layouts/InsuranceLayout';
import { buildMetadata } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Review Your Policy',
  description:
    'Review your travel insurance details before proceeding to payment.',
  canonical: 'https://www.mydummyticket.ae/insurance-booking/review',
  robots: { index: false, follow: false },
});

export default function TravelInsuranceReviewLayout({ children }) {
  return <InsuranceLayout>{children}</InsuranceLayout>;
}
