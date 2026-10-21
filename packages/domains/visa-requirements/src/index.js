import VisaRuleSchema, { OUTCOMES } from './schemas/visa-rule.schema.js';
import VisaRequirementSearchSchema from './schemas/visa-requirement-search.schema.js';
import { createCuratedProvider } from './providers/curated.js';
import { createVisaRequirementsService } from './service.js';
import { createVisaRequirementsController } from './controller.js';
import { createVisaRequirementsRouterFromParts } from './router.js';
import { getOrRegisterModel } from '@travel-suite/utils/model';


export function createVisaRequirementsRouter({ db, auth, servicedSlugs = [], logger }) {
  const VisaRule = getOrRegisterModel(db, 'visa-rule', VisaRuleSchema);
  const VisaRequirementSearch = getOrRegisterModel(db, 'visa-requirement-search', VisaRequirementSearchSchema);

  const providers = [createCuratedProvider({ VisaRule })];

  const service = createVisaRequirementsService({ VisaRule, VisaRequirementSearch, providers, servicedSlugs });
  const controller = createVisaRequirementsController({ service });
  const router = createVisaRequirementsRouterFromParts({ controller, auth });

  return { router, service, controller, VisaRule, VisaRequirementSearch };
}

export { VisaRuleSchema, VisaRequirementSearchSchema, OUTCOMES };
