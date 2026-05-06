import mongoose from 'mongoose';
import AffiliateSchema from './schema.js';
import { createAffiliateService } from './service.js';
import { createAffiliateController } from './controller.js';
import { createAffiliateRouter } from './router.js';

export { AffiliateSchema };

function getOrRegisterModel(conn, name, schema) {
  try { return conn.model(name); }
  catch { return conn.model(name, schema); }
}

/**
 * Creates the affiliates router.
 *
 * TicketModel MUST be passed from the host backend — never let affiliates
 * register its own Ticket model or it will block the full schema registration
 * from @travel-suite/tickets.
 *
 * InsuranceApplicationModel MUST be passed from the host backend when the app
 * supports insurance commissions — never register it here directly.
 *
 * Recommended wiring in routes/index.js:
 *
 *   // Ticket-only apps (mdt, dt365, travl):
 *   import { createAffiliatesRouter, AffiliateSchema } from '@travel-suite/affiliates';
 *   const AffiliateModel = getOrRegisterModel(db, 'Affiliate', AffiliateSchema);
 *   const { router: ticketsRouter, ..., TicketModel } = createTicketsRouter({ ..., AffiliateModel });
 *   router.use('/affiliates', createAffiliatesRouter({ db, auth, TicketModel }));
 *
 *   // Insurance-only apps (travelshield):
 *   createInsuranceRouter({ db, ... }); // registers 'insurance-application' model
 *   const InsuranceApplicationModel = db.model('insurance-application');
 *   router.use('/affiliates', createAffiliatesRouter({ db, auth, InsuranceApplicationModel }));
 *
 *   // Both:
 *   router.use('/affiliates', createAffiliatesRouter({ db, auth, TicketModel, InsuranceApplicationModel }));
 *
 * @param {{ db, auth, TicketModel?, InsuranceApplicationModel? }} deps
 */
export function createAffiliatesRouter({ db, auth, TicketModel = null, InsuranceApplicationModel = null }) {

  const Affiliate = getOrRegisterModel(db, 'Affiliate', AffiliateSchema);

  const service = createAffiliateService({
    Affiliate,
    Ticket: TicketModel,
    InsuranceApplication: InsuranceApplicationModel,
  });
  const controller = createAffiliateController({ service });
  const router = createAffiliateRouter({ controller, auth });

  return router;
}
