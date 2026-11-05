'use client';

import HotelPaymentPage from '@travel-suite/frontend-shared/pages/client/HotelPaymentPage';
import { trackPurchaseEvent } from '@travel-suite/frontend-shared/utils/analytics';

export default function Page() {
  return <HotelPaymentPage onPurchaseEvent={trackPurchaseEvent} supportEmail="info@dummyticket365.com" />;
}
