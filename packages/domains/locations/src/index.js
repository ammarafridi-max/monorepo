import { createLocationService }    from './service.js';
import { createLocationController } from './controller.js';
import { createLocationRouter }     from './router.js';

export function createLocationsRouter({ googleMapsApiKey, ipInfoApiKey }) {
  const service    = createLocationService({ googleMapsApiKey, ipInfoApiKey });
  const controller = createLocationController({ service });
  return createLocationRouter({ controller });
}
