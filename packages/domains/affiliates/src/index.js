import AffiliateSchema from './schema.js';
import AffiliatePayoutSchema from './payout.schema.js';
import { createAffiliateService } from './service.js';
import { createAffiliatePayoutService } from './payout.service.js';
import { createAffiliateController, createAffiliatePayoutController } from './controller.js';
import { createAffiliateRouter } from './router.js';

export { AffiliateSchema, AffiliatePayoutSchema };

function getOrRegisterModel(conn, name, schema) {
  try { return conn.model(name); }
  catch { return conn.model(name, schema); }
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
  const Affiliate = getOrRegisterModel(db, 'Affiliate', AffiliateSchema);
  const AffiliatePayout = getOrRegisterModel(db, 'AffiliatePayout', AffiliatePayoutSchema);
  const resolveCurrencyModel = () => CurrencyModel ?? db.models?.Currency ?? null;

  const service = createAffiliateService({
    Affiliate,
    Ticket: TicketModel,
    InsuranceApplication: InsuranceApplicationModel,
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

  const controller = createAffiliateController({ service });
  const payoutController = createAffiliatePayoutController({ service: payoutService });
  const router = createAffiliateRouter({ controller, payoutController, auth });

  return router;
}
