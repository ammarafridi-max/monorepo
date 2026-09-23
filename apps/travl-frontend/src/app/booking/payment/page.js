'use client';

import TicketPaymentPage from '@travel-suite/frontend-shared/pages/client/TicketPaymentPage';
import { trackPurchaseEvent } from '@travel-suite/frontend-shared/utils/analytics';
import { EMAIL } from '@/config/contact';
import { LuShieldPlus } from 'react-icons/lu';

// Cross-sell after a flight reservation purchase: travel insurance (own).
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
      supportEmail={EMAIL}
      upsells={upsells}
      productNoun="flight reservation"
    />
  );
}
