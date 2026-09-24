import InsurancePaymentPage from '@travel-suite/frontend-shared/pages/client/InsurancePaymentPage';
import { Ticket } from 'lucide-react';

export const metadata = {
  title: 'Booking Confirmed | The Dummy Ticket AE',
  description: 'Your travel insurance policy has been confirmed.',
};

// Cross-sell after an insurance purchase: dummy ticket (own, booking form is on the homepage).
const upsells = [
  {
    icon: <Ticket size={15} />,
    title: 'Need a Dummy Ticket?',
    description:
      'Add a flight reservation with a live PNR, the other document consulates ask for.',
    priceCaption: 'from',
    price: 'AED 49',
    href: '/',
  },
];

export default function PaymentPage() {
  return <InsurancePaymentPage upsells={upsells} />;
}
