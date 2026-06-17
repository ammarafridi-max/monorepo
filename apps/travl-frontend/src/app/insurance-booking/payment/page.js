import InsurancePaymentPage from '@travel-suite/frontend-shared/pages/client/shared/InsurancePaymentPage';
import { Plane, Ticket } from 'lucide-react';

export const metadata = {
  title: 'Booking Confirmed — Travl',
  description: 'Your travel insurance policy has been confirmed.',
};

// Cross-sell after an insurance purchase: itinerary (own) + dummy ticket (referred out).
const upsells = [
  {
    icon: <Plane size={15} />,
    title: 'Need a Travel Itinerary?',
    description:
      'Generate an embassy-ready, day-by-day travel itinerary for your visa application.',
    priceCaption: 'from',
    price: 'AED 49',
    href: '/travel-itinerary',
  },
  {
    icon: <Ticket size={15} />,
    title: 'Need a Dummy Ticket?',
    description:
      'Get a verifiable flight reservation accepted by embassies and visa centers for your application.',
    priceCaption: 'from',
    price: 'AED 49',
    href: 'https://www.mydummyticket.ae',
    external: true,
  },
];

export default function PaymentPage() {
  return <InsurancePaymentPage upsells={upsells} />;
}
