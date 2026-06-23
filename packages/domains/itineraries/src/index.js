import ItineraryOrderSchema from './schemas/itinerary-order.schema.js';
import { createItineraryGenerator } from './claude.js';
import { createPdfRenderer } from './pdf.js';
import { createItineraryService } from './service.js';
import { createItineraryController } from './controller.js';
import { createItineraryRouter } from './router.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

/**
 * Assembles the travel-itinerary feature.
 *
 * @param {{
 *   db: import('mongoose').Connection,
 *   stripe: import('stripe').Stripe,
 *   anthropicApiKey: string,
 *   frontendUrl: string,
 *   brand?: object,            // { name, companyName, domain, primaryColor, accentColor }
 *   price?: number,            // default 49
 *   currency?: string,         // default 'AED'
 *   freeRegenLimit?: number,   // pre-payment, default 2
 *   postPaymentEditLimit?: number, // default 2
 *   editWindowDays?: number,   // default 7
 *   generateLimiter?: import('express').RequestHandler, // per-IP limiter for generation routes
 * }} deps
 * @returns {{ router: import('express').Router, handleStripeSuccess: (session: object) => Promise<void> }}
 */
export function createItinerariesRouter({
  db,
  stripe,
  anthropicApiKey,
  frontendUrl,
  frontendPathBase,
  brand,
  price,
  currency,
  freeRegenLimit,
  postPaymentEditLimit,
  editWindowDays,
  chatLimit,
  storage,
  sendItineraryEmail,
  auth,
  generateLimiter,
}) {
  const Order = getOrRegisterModel(db, 'itinerary-order', ItineraryOrderSchema);

  const generator = createItineraryGenerator({ anthropicApiKey });
  const pdfRenderer = createPdfRenderer({ brand });

  const service = createItineraryService({
    Order,
    generator,
    pdfRenderer,
    storage,
    sendItineraryEmail,
    stripe,
    frontendUrl,
    frontendPathBase,
    brand,
    price,
    currency,
    freeRegenLimit,
    postPaymentEditLimit,
    editWindowDays,
    chatLimit,
  });

  const controller = createItineraryController({ service });
  const router = createItineraryRouter({ controller, auth, generateLimiter });

  return {
    router,
    handleStripeSuccess: (session) => service.handleStripeSuccess(session),
    OrderModel: Order,
    pdfRenderer,
  };
}

export { default as ItineraryOrderSchema } from './schemas/itinerary-order.schema.js';
export { validateItinerary, expectedCountryOrder } from './validation.js';
