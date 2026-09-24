'use client';

import TicketPaymentPage from '@travel-suite/frontend-shared/pages/client/TicketPaymentPage';
import { trackPurchaseEvent } from '@travel-suite/frontend-shared/utils/analytics';
import { LuShieldPlus } from 'react-icons/lu';

// Cross-sell after a dummy-ticket purchase: travel insurance (own).
const upsells = [
  {
    icon: <LuShieldPlus size={15} />,
    title: 'Add Travel Insurance?',
    description:
      'Add genuine AXA cover to the same file. Meets the Schengen medical minimum, for UAE residents.',
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
      supportEmail="info@thedummyticket.ae"
      upsells={upsells}
    />
  );
}
