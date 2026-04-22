import InsuranceLayout from '@/layouts/InsuranceLayout';

export const metadata = {
  title: 'Review Your Policy — TravelShield',
  description:
    'Review your travel insurance details before proceeding to payment.',
  robots: { index: false, follow: false },
};

export default function ReviewLayout({ children }) {
  return <InsuranceLayout>{children}</InsuranceLayout>;
}
