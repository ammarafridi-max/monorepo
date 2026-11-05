import { getBrand } from '@travel-suite/config';
import { buildRobots } from '@travel-suite/frontend-shared/seo/robots';

export default function robots() {
  return buildRobots(getBrand('emirateslimo'), {
    disallow: ['/admin', '/book', '/payment'],
  });
}
