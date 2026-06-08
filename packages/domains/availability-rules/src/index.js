import { VehicleSchema } from '@travel-suite/vehicles';
import { ZoneSchema } from '@travel-suite/zones';
import AvailabilityRuleSchema from './schema.js';
import { createAvailabilityRuleService } from './service.js';
import { createAvailabilityRuleController } from './controller.js';
import { createAvailabilityRuleRouterFromParts } from './router.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createAvailabilityRulesRouter({ db, auth }) {
  getOrRegisterModel(db, 'Vehicle', VehicleSchema);
  getOrRegisterModel(db, 'Zone', ZoneSchema);
  const AvailabilityRule = getOrRegisterModel(db, 'AvailabilityRule', AvailabilityRuleSchema);

  const service = createAvailabilityRuleService({ AvailabilityRule });
  const controller = createAvailabilityRuleController({ service });
  return createAvailabilityRuleRouterFromParts({ controller, auth });
}

export { AvailabilityRuleSchema };
export { availabilityRuleSchema } from './validators.js';
