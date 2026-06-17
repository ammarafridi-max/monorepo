import ItineraryLayout from '@travel-suite/frontend-shared/layouts/ItineraryLayout';
import ItinerarySuccessPage from '@travel-suite/frontend-shared/pages/client/shared/ItinerarySuccessPage';
import { ShieldCheck, Ticket } from 'lucide-react';

export const metadata = {
  title: 'Itinerary Ready | Travl',
  robots: { index: false, follow: false },
};

// Cross-sell after an itinerary purchase: insurance (own) + dummy ticket (referred out).
const upsells = [
  {
    icon: <ShieldCheck size={15} />,
    title: 'Add Travel Insurance?',
    description:
      'Get a genuine travel insurance policy accepted by embassies for visa applications. Exclusively for UAE residents.',
    href: '/travel-insurance',
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

export default async function Page({ params }) {
  const { sessionId } = await params;
  return (
    <ItineraryLayout>
      <ItinerarySuccessPage sessionId={sessionId} upsells={upsells} />
    </ItineraryLayout>
  );
}
