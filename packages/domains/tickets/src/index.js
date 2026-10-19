import TicketSchema from './schemas/ticket.schema.js';
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

export function createTicketsRouter({ db, auth, stripe, paypal, notifications, frontendUrl, AffiliateModel, brevo, reviewListId, reservationStorage, sendEmail, metaCapi, openaiCapi }) {
  if (!AffiliateModel) {
    throw new Error('createTicketsRouter requires AffiliateModel: pass the Affiliate model registered from @travel-suite/affiliates');
  }

  const Ticket = getOrRegisterModel(db, 'dummy-ticket', TicketSchema);
  const Affiliate = AffiliateModel;
  const TicketPricing = getOrRegisterModel(db, 'dummy-ticket-pricing', TicketPricingSchema);
  const Currency = getOrRegisterModel(db, 'Currency', CurrencySchema);

  const pricingService = createPricingService({ TicketPricing, Currency });
  const currencyService = createCurrencyService({ Currency });

  const paidOrderBus = createPaidOrderBus();

  const service = createTicketService({ Ticket, Affiliate, pricingService, currencyService, stripe, paypal, notifications, frontendUrl, brevo, reviewListId, paidOrderBus, reservationStorage, sendEmail, metaCapi, openaiCapi });
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

