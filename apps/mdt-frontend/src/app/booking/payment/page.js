'use client';

import TicketPaymentPage from '@travel-suite/frontend-shared/pages/client/shared/TicketPaymentPage';
import { trackPurchaseEvent } from '@travel-suite/frontend-shared/utils/analytics';
import { LuShieldPlus } from 'react-icons/lu';

// Cross-sell after a dummy-ticket purchase: travel insurance (own).
const upsells = [
  {
    icon: <LuShieldPlus size={15} />,
    title: 'Add Travel Insurance?',
    description:
      'Get a genuine travel insurance policy accepted by embassies for visa applications. Exclusively for UAE residents.',
    href: '/travel-insurance',
    badge: 'Recommended',
    price: 'AED 30',
    priceCaption: 'from',
  },
];

export default function Page() {
  return (
    <TicketPaymentPage
      onPurchaseEvent={trackPurchaseEvent}
      supportEmail="info@mydummyticket.ae"
      upsells={upsells}
    />
  );
}
