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
 * Recommended wiring in routes/index.js:
 *   import { createAffiliatesRouter, AffiliateSchema } from '@travel-suite/affiliates';
 *   const AffiliateModel = getOrRegisterModel(db, 'Affiliate', AffiliateSchema);
 *   const { router: ticketsRouter, ..., TicketModel } = createTicketsRouter({ ..., AffiliateModel });
 *   router.use('/affiliates', createAffiliatesRouter({ db, auth, TicketModel }));
 *
 * @param {{ db: import('mongoose').Connection, auth: object, TicketModel: import('mongoose').Model }} deps
 */
export function createAffiliatesRouter({ db, auth, TicketModel = null }) {

  const Affiliate = getOrRegisterModel(db, 'Affiliate', AffiliateSchema);

  const service = createAffiliateService({ Affiliate, Ticket: TicketModel });
  const controller = createAffiliateController({ service });
  const router = createAffiliateRouter({ controller, auth });

  return router;
}
