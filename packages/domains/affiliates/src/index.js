import AffiliateSchema from './affiliate.schema.js';
import AffiliatePayoutSchema from './payout.schema.js';
import AffiliateClickSchema from './click.schema.js';
import { createAffiliateService } from './service.js';
import { createAffiliatePayoutService } from './payout.service.js';
import { createAffiliateController, createAffiliatePayoutController } from './controller.js';
import { createAffiliateRouter } from './router.js';
import { getOrRegisterModel } from '@travel-suite/utils/model';

export { AffiliateSchema, AffiliatePayoutSchema, AffiliateClickSchema };

export function registerAffiliateModels({ db }) {
  return {
    Affiliate: getOrRegisterModel(db, 'affiliate', AffiliateSchema),
    AffiliatePayout: getOrRegisterModel(db, 'affiliate-payout', AffiliatePayoutSchema),
    AffiliateClick: getOrRegisterModel(db, 'affiliate-click', AffiliateClickSchema),
  };
}


export function createAffiliatesRouter({
  db,
  auth,
  TicketModel = null,
  InsuranceApplicationModel = null,
  CurrencyModel = null,
  payoutHoldDays = 0,
  notifications = null,
  trackingBaseUrl = null,
  logger = null,
}) {
  const { Affiliate, AffiliatePayout, AffiliateClick } = registerAffiliateModels({ db });
  const resolveCurrencyModel = () => CurrencyModel ?? db.models?.currency ?? null;
  const resolveInsuranceApplicationModel = () =>
    InsuranceApplicationModel ?? db.models?.['insurance-application'] ?? null;

  const service = createAffiliateService({
    Affiliate,
    AffiliateClick,
    AffiliatePayout,
    Ticket: TicketModel,
    resolveInsuranceApplicationModel,
    resolveCurrencyModel,
    notifications,
    trackingBaseUrl,
    logger,
  });
  const payoutService = createAffiliatePayoutService({
    Affiliate,
    AffiliatePayout,
    Ticket: TicketModel,
    resolveCurrencyModel,
    holdDays: payoutHoldDays,
    notifications,
    logger,
  });

  const controller = createAffiliateController({ service, logger });
  const payoutController = createAffiliatePayoutController({ service: payoutService });
  const router = createAffiliateRouter({ controller, payoutController, auth });

  return router;
}
