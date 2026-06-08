import VehicleSchema from './schema.js';
import { createVehicleService } from './service.js';
import { createVehicleController } from './controller.js';
import { createVehicleRouterFromParts } from './router.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

/**
 * @param db      Mongoose connection
 * @param auth    { protect, restrictTo } middleware (from @travel-suite/auth)
 * @param images  Image-store adapter — see createVehicleService for the contract.
 */
export function createVehiclesRouter({ db, auth, images }) {
  const Vehicle = getOrRegisterModel(db, 'Vehicle', VehicleSchema);
  const service = createVehicleService({ Vehicle, images });
  const controller = createVehicleController({ service });
  return createVehicleRouterFromParts({ controller, auth });
}

export { VehicleSchema };
