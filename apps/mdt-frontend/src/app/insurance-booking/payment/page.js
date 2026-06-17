import InsurancePaymentPage from '@travel-suite/frontend-shared/pages/client/shared/InsurancePaymentPage';
import { Ticket } from 'lucide-react';

export const metadata = {
  title: 'Booking Confirmed — My Dummy Ticket',
  description: 'Your travel insurance policy has been confirmed.',
};

// Cross-sell after an insurance purchase: dummy ticket (own — booking form is on the homepage).
const upsells = [
  {
    icon: <Ticket size={15} />,
    title: 'Need a Dummy Ticket?',
    description:
      'Get a verifiable flight reservation accepted by embassies and visa centers for your application.',
    priceCaption: 'from',
    price: 'AED 49',
    href: '/',
  },
];

export default function PaymentPage() {
  return <InsurancePaymentPage upsells={upsells} />;
}
