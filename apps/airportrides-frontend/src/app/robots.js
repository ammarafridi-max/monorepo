import { getBrand } from '@travel-suite/config';
import { buildRobots } from '@travel-suite/frontend-shared/seo/robots';
import { SITE_URL } from '@/config';

export default function robots() {
  return buildRobots(getBrand('airportrides'), {
    siteUrl: SITE_URL,
    disallow: ['/admin', '/api'],
  });
}
