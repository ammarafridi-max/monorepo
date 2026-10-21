import VehicleSchema from './schema.js';
import { createVehicleService } from './service.js';
import { createVehicleController } from './controller.js';
import { createVehicleRouterFromParts } from './router.js';
import { getOrRegisterModel } from '@travel-suite/utils/model';


export function createVehiclesRouter({ db, auth, images }) {
  const Vehicle = getOrRegisterModel(db, 'vehicle', VehicleSchema);
  const service = createVehicleService({ Vehicle, images });
  const controller = createVehicleController({ service });
  return createVehicleRouterFromParts({ controller, auth });
}

export { VehicleSchema };
