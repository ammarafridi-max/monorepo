import { VehicleSchema } from '@travel-suite/vehicles';
import { ZoneSchema } from '@travel-suite/zones';
import AvailabilityRuleSchema from './schema.js';
import { createAvailabilityRuleService } from './service.js';
import { createAvailabilityRuleController } from './controller.js';
import { createAvailabilityRuleRouterFromParts } from './router.js';
import { getOrRegisterModel } from '@travel-suite/utils/model';


export function createAvailabilityRulesRouter({ db, auth }) {
  getOrRegisterModel(db, 'vehicle', VehicleSchema);
  getOrRegisterModel(db, 'zone', ZoneSchema);
  const AvailabilityRule = getOrRegisterModel(db, 'availability-rule', AvailabilityRuleSchema);

  const service = createAvailabilityRuleService({ AvailabilityRule });
  const controller = createAvailabilityRuleController({ service });
  return createAvailabilityRuleRouterFromParts({ controller, auth });
}

export { AvailabilityRuleSchema };
export { availabilityRuleSchema } from './validators.js';
