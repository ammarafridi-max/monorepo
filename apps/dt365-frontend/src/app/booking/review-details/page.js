'use client';

import TicketReviewDetailsPage from '@travel-suite/frontend-shared/pages/client/shared/TicketReviewDetailsPage';
import { trackBeginCheckout } from '@travel-suite/frontend-shared/utils/analytics';

export default function Page() {
  return <TicketReviewDetailsPage onBeginCheckout={trackBeginCheckout} enablePayPal={false} />;
}
