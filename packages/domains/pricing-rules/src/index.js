import { VehicleSchema } from '@travel-suite/vehicles';
import { ZoneSchema } from '@travel-suite/zones';
import PricingRuleSchema from './schema.js';
import { createPricingRuleService } from './service.js';
import { createPricingRuleController } from './controller.js';
import { createPricingRuleRouterFromParts } from './router.js';
import { getOrRegisterModel } from '@travel-suite/utils/model';


export function createPricingRulesRouter({ db, auth }) {
  const Vehicle = getOrRegisterModel(db, 'vehicle', VehicleSchema);
  const Zone = getOrRegisterModel(db, 'zone', ZoneSchema);
  const PricingRule = getOrRegisterModel(db, 'pricing-rule', PricingRuleSchema);

  const service = createPricingRuleService({ PricingRule, Vehicle, Zone });
  const controller = createPricingRuleController({ service });
  return createPricingRuleRouterFromParts({ controller, auth });
}

export { PricingRuleSchema };
