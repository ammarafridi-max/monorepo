'use client';

import HotelReviewDetailsPage from '@travel-suite/frontend-shared/pages/client/HotelReviewDetailsPage';
import { trackBeginCheckout } from '@travel-suite/frontend-shared/utils/analytics';

export default function Page() {
  return <HotelReviewDetailsPage onBeginCheckout={trackBeginCheckout} />;
}
