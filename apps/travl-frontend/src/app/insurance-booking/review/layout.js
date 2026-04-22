import InsuranceLayout from '@/layouts/InsuranceLayout';
import { buildMetadata } from '@/lib/publicMetadata';

export const metadata = buildMetadata({
  title: 'Review Your Policy',
  description:
    'Review your travel insurance details before proceeding to payment.',
  canonical: 'https://www.travl.ae/insurance-booking/review',
  robots: { index: false, follow: false },
});

export default function TravelInsuranceReviewLayout({ children }) {
  return <InsuranceLayout>{children}</InsuranceLayout>;
}
