'use client';

import TicketReviewDetailsPage from '@travel-suite/frontend-shared/pages/client/TicketReviewDetailsPage';
import { trackBeginCheckout } from '@travel-suite/frontend-shared/utils/analytics';

export default function Page() {
  return <TicketReviewDetailsPage onBeginCheckout={trackBeginCheckout} />;
}
