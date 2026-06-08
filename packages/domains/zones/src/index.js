import ZoneSchema from './schema.js';
import { createZoneService } from './service.js';
import { createZoneController } from './controller.js';
import { createZoneRouterFromParts } from './router.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createZonesRouter({ db, auth }) {
  const Zone = getOrRegisterModel(db, 'Zone', ZoneSchema);
  const service = createZoneService({ Zone });
  const controller = createZoneController({ service });
  return createZoneRouterFromParts({ controller, auth });
}

export { ZoneSchema };
