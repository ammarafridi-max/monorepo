import AffiliateSchema from './schema.js';
import AffiliatePayoutSchema from './payout.schema.js';
import AffiliateClickSchema from './click.schema.js';
import { createAffiliateService } from './service.js';
import { createAffiliatePayoutService } from './payout.service.js';
import { createAffiliateController, createAffiliatePayoutController } from './controller.js';
import { createAffiliateRouter } from './router.js';

export { AffiliateSchema, AffiliatePayoutSchema, AffiliateClickSchema };

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
  const AffiliateClick = getOrRegisterModel(db, 'AffiliateClick', AffiliateClickSchema);
  const resolveCurrencyModel = () => CurrencyModel ?? db.models?.Currency ?? null;
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
