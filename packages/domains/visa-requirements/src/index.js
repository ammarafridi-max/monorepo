import VisaRuleSchema, { OUTCOMES } from './schemas/visaRule.schema.js';
import VisaQuerySchema from './schemas/visaQuery.schema.js';
import { createCuratedProvider } from './providers/curated.js';
import { createVisaRequirementsService } from './service.js';
import { createVisaRequirementsController } from './controller.js';
import { createVisaRequirementsRouterFromParts } from './router.js';

function getOrRegisterModel(conn, name, schema) {
  try { return conn.model(name); } catch { return conn.model(name, schema); }
}

export function createVisaRequirementsRouter({ db, auth, servicedSlugs = [], logger }) {
  const VisaRule = getOrRegisterModel(db, 'visa-rule', VisaRuleSchema);
  const VisaQuery = getOrRegisterModel(db, 'visa-query', VisaQuerySchema);

  const providers = [createCuratedProvider({ VisaRule })];

  const service = createVisaRequirementsService({ VisaRule, VisaQuery, providers, servicedSlugs });
  const controller = createVisaRequirementsController({ service });
  const router = createVisaRequirementsRouterFromParts({ controller, auth });

  return { router, service, controller, VisaRule, VisaQuery };
}

export { VisaRuleSchema, VisaQuerySchema, OUTCOMES };
