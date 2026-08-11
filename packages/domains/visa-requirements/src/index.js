import VisaRuleSchema, { OUTCOMES } from './schemas/visaRule.schema.js';
import VisaQuerySchema from './schemas/visaQuery.schema.js';
import { createCuratedProvider } from './providers/curated.js';
import { createVisaRequirementsService } from './service.js';
import { createVisaRequirementsController } from './controller.js';
import { createVisaRequirementsRouterFromParts } from './router.js';

function getOrRegisterModel(conn, name, schema) {
  try { return conn.model(name); } catch { return conn.model(name, schema); }
}

/**
 * @param servicedSlugs visa page slugs the brand actually sells, used to decide
 *        whether a "visa required" answer should push the consultation CTA.
 *
 * Providers are an ordered list so a third-party source can be added later
 * without touching the service, the router or the frontend. Nothing is wired to
 * one today: we ran the numbers on Sherpa and it was $1,500/month with no
 * residence field, which is the one thing this tool needs to get right.
 */
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
