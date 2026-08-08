'use client';

import TicketPaymentPage from '@travel-suite/frontend-shared/pages/client/TicketPaymentPage';
import { trackPurchaseEvent } from '@travel-suite/frontend-shared/utils/analytics';

export default function Page() {
  return (
    <TicketPaymentPage
      onPurchaseEvent={trackPurchaseEvent}
      supportEmail="info@dummyticket365.com"
    />
  );
}
