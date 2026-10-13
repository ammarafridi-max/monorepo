import { createOpenAIAdsService } from './service.js';
import { createOpenAIAdsController } from './controller.js';
import { createOpenAIAdsRouterFromParts } from './router.js';

export function createOpenAIAdsRouter({ adsClient, auth, countOwnConversions, maxDailyBudget, logger }) {
  const service = createOpenAIAdsService({ adsClient, countOwnConversions, maxDailyBudget, logger });
  const controller = createOpenAIAdsController({ service });
  const router = createOpenAIAdsRouterFromParts({ controller, auth });
  return { router, service, controller };
}
