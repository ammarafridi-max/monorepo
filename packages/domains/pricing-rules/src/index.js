import { VehicleSchema } from '@travel-suite/vehicles';
import { ZoneSchema } from '@travel-suite/zones';
import PricingRuleSchema from './schema.js';
import { createPricingRuleService } from './service.js';
import { createPricingRuleController } from './controller.js';
import { createPricingRuleRouterFromParts } from './router.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createPricingRulesRouter({ db, auth }) {
  const Vehicle = getOrRegisterModel(db, 'Vehicle', VehicleSchema);
  const Zone = getOrRegisterModel(db, 'Zone', ZoneSchema);
  const PricingRule = getOrRegisterModel(db, 'PricingRule', PricingRuleSchema);

  const service = createPricingRuleService({ PricingRule, Vehicle, Zone });
  const controller = createPricingRuleController({ service });
  return createPricingRuleRouterFromParts({ controller, auth });
}

export { PricingRuleSchema };
