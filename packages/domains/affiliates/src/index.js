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

// TicketModel/InsuranceApplicationModel must come from the host backend; registering them here blocks the full schema registration.
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
