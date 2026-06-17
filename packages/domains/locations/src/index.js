import { createLocationService }    from './service.js';
import { createLocationController } from './controller.js';
import { createLocationRouter }     from './router.js';

export function createLocationsRouter({ googleMapsApiKey, ipInfoApiKey, airlabs }) {
  const service    = createLocationService({ googleMapsApiKey, ipInfoApiKey, airlabs });
  const controller = createLocationController({ service });
  return createLocationRouter({ controller });
}
