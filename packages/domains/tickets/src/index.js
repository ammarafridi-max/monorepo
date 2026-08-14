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
import { createPaidOrderBus } from './paidOrderBus.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createTicketsRouter({ db, auth, stripe, paypal, notifications, frontendUrl, AffiliateModel, brevo, reviewListId, reservationStorage, sendEmail }) {
  const Ticket = getOrRegisterModel(db, 'dummy-ticket', TicketSchema);
  const Affiliate = AffiliateModel ?? getOrRegisterModel(db, 'Affiliate', AffiliateSchema);
  const TicketPricing = getOrRegisterModel(db, 'dummy-ticket-pricing', TicketPricingSchema);
  const Currency = getOrRegisterModel(db, 'Currency', CurrencySchema);

  const pricingService = createPricingService({ TicketPricing });
  const currencyService = createCurrencyService({ Currency });

  const paidOrderBus = createPaidOrderBus();

  const service = createTicketService({ Ticket, Affiliate, pricingService, currencyService, stripe, paypal, notifications, frontendUrl, brevo, reviewListId, paidOrderBus, reservationStorage, sendEmail });
  const controller = createTicketController({ service, paidOrderBus });
  const router = createTicketRouter({ controller, auth });

  const pricingRouter = createPricingRouter({ service: pricingService, auth });

  return {
    router,
    pricingRouter,
    handleStripeSuccess: (session) => service.handleStripeSuccess(session),
    TicketModel: Ticket,
  };
}

