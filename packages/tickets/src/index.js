import mongoose from 'mongoose';
import TicketSchema from './schemas/ticket.schema.js';
import AffiliateSchema from './schemas/affiliate.schema.js';
import TicketPricingSchema from './schemas/pricing.schema.js';
import CurrencySchema from './schemas/currency.schema.js';
import { createTicketService } from './service.js';
import { createPricingService } from './pricing.service.js';
import { createCurrencyService } from './currency.service.js';
import { createTicketController } from './controller.js';
import { createTicketRouter } from './router.js';
import { createPricingRouter } from './pricing.router.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createTicketsRouter({ db, auth, stripe, notifications, frontendUrl, AffiliateModel }) {
  // 'dummy-ticket' maps to the 'dummy-tickets' collection.
  const Ticket = getOrRegisterModel(db, 'dummy-ticket', TicketSchema);
  // Use the pre-registered full Affiliate model if provided (has generateUniqueAffiliateId statics).
  // Falls back to registering the stub schema when used standalone (e.g. travelshield).
  const Affiliate = AffiliateModel ?? getOrRegisterModel(db, 'Affiliate', AffiliateSchema);
  // 'dummy-ticket-pricing' maps to the 'dummy-ticket-pricings' collection.
  const TicketPricing = getOrRegisterModel(db, 'dummy-ticket-pricing', TicketPricingSchema);
  const Currency = getOrRegisterModel(db, 'Currency', CurrencySchema);

  const pricingService = createPricingService({ TicketPricing });
  const currencyService = createCurrencyService({ Currency });

  const service = createTicketService({ Ticket, Affiliate, pricingService, currencyService, stripe, notifications, frontendUrl });
  const controller = createTicketController({ service });
  const router = createTicketRouter({ controller, auth });

  const pricingRouter = createPricingRouter({ service: pricingService, auth });

  return {
    router,
    pricingRouter,
    handleStripeSuccess: (session) => service.handleStripeSuccess(session),
    TicketModel: Ticket,
  };
}

export async function sendDueDeliveryEmails(db, notifications) {
  const Ticket = getOrRegisterModel(db, 'dummy-ticket', TicketSchema);
  const TicketPricing = getOrRegisterModel(db, 'dummy-ticket-pricing', TicketPricingSchema);
  const Currency = getOrRegisterModel(db, 'Currency', CurrencySchema);
  const Affiliate = getOrRegisterModel(db, 'Affiliate', AffiliateSchema);
  const pricingService = createPricingService({ TicketPricing });
  const currencyService = createCurrencyService({ Currency });

  const service = createTicketService({ Ticket, Affiliate, pricingService, currencyService, stripe: null, notifications, frontendUrl: null });
  return service.sendDueDeliveryEmails();
}
