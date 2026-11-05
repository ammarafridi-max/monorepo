import { getBrand } from '@travel-suite/config';
import { buildRobots } from '@travel-suite/frontend-shared/seo/robots';

export default function robots() {
  return buildRobots(getBrand('travl'), {
    disallow: [
      '/admin',
      '/booking',
      '/insurance-booking/quote',
      '/insurance-booking/passengers',
      '/insurance-booking/review',
      '/insurance-booking/payment',
      '/itinerary-booking/*',
    ],
  });
}
