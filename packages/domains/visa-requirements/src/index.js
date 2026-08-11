import VisaRuleSchema, { OUTCOMES } from './schemas/visaRule.schema.js';
import VisaQuerySchema from './schemas/visaQuery.schema.js';
import { createCuratedProvider } from './providers/curated.js';
import { createSherpaProvider } from './providers/sherpa.js';
import { createVisaRequirementsService } from './service.js';
import { createVisaRequirementsController } from './controller.js';
import { createVisaRequirementsRouterFromParts } from './router.js';

function getOrRegisterModel(conn, name, schema) {
  try { return conn.model(name); } catch { return conn.model(name, schema); }
}

/**
 * @param servicedSlugs visa page slugs the brand actually sells, used to decide
 *        whether a "visa required" answer should push the consultation CTA.
 * @param sherpaApiKey  optional. When absent the Sherpa provider is not built,
 *        so the tool runs entirely on curated rules and costs nothing.
 */
export function createVisaRequirementsRouter({ db, auth, servicedSlugs = [], sherpaApiKey = null, logger }) {
  const VisaRule = getOrRegisterModel(db, 'visa-rule', VisaRuleSchema);
  const VisaQuery = getOrRegisterModel(db, 'visa-query', VisaQuerySchema);

  // Order matters: our own rules answer first. They are the only source that
  // understands residence, which is the whole point of asking for it.
  const providers = [
    createCuratedProvider({ VisaRule }),
    createSherpaProvider({ apiKey: sherpaApiKey, logger }),
  ].filter(Boolean);

  const service = createVisaRequirementsService({ VisaRule, VisaQuery, providers, servicedSlugs });
  const controller = createVisaRequirementsController({ service });
  const router = createVisaRequirementsRouterFromParts({ controller, auth });

  return { router, service, controller, VisaRule, VisaQuery };
}

export { VisaRuleSchema, VisaQuerySchema, OUTCOMES };
