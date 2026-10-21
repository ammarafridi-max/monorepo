import ZoneSchema from './schema.js';
import { createZoneService } from './service.js';
import { createZoneController } from './controller.js';
import { createZoneRouterFromParts } from './router.js';
import { getOrRegisterModel } from '@travel-suite/utils/model';


export function createZonesRouter({ db, auth }) {
  const Zone = getOrRegisterModel(db, 'zone', ZoneSchema);
  const service = createZoneService({ Zone });
  const controller = createZoneController({ service });
  return createZoneRouterFromParts({ controller, auth });
}

export { ZoneSchema };
