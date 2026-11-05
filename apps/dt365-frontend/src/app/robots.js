import { getBrand } from '@travel-suite/config';
import { buildRobots } from '@travel-suite/frontend-shared/seo/robots';

export default function robots() {
  return buildRobots(getBrand('dt365'), {
    disallow: ['/admin', '/booking', '/insurance-booking'],
  });
}
