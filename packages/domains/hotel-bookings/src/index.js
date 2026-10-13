import HotelBookingSchema from './schemas/hotel-booking.schema.js';
import HotelBookingPricingSchema from './schemas/pricing.schema.js';
import { createHotelBookingService } from './service.js';
import { createHotelPricingService } from './pricing.service.js';
import { createHotelBookingController } from './controller.js';
import { createHotelBookingRouter, createHotelPricingRouter } from './router.js';
import { createPaidOrderBus } from './paidOrderBus.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createHotelBookingsRouter({
  db,
  auth,
  stripe,
  supplier,
  citySuggest,
  notifications,
  frontendUrl,
  AffiliateModel,
  CurrencyModel,
  paidOrderBus: injectedBus,
  minFreeCancellationMarginMs,
}) {
  const HotelBooking = getOrRegisterModel(db, 'hotel-booking', HotelBookingSchema);
  const HotelBookingPricing = getOrRegisterModel(db, 'hotel-booking-pricing', HotelBookingPricingSchema);

  const pricingService = createHotelPricingService({ HotelBookingPricing, Currency: CurrencyModel });
  const paidOrderBus = injectedBus ?? createPaidOrderBus();

  const service = createHotelBookingService({
    HotelBooking,
    Affiliate: AffiliateModel,
    supplier,
    citySuggest,
    pricingService,
    stripe,
    notifications,
    frontendUrl,
    paidOrderBus,
    ...(minFreeCancellationMarginMs ? { minFreeCancellationMarginMs } : {}),
  });

  const controller = createHotelBookingController({ service, pricingService, paidOrderBus });
  const router = createHotelBookingRouter({ controller, auth });
  const pricingRouter = createHotelPricingRouter({ controller, auth });

  return {
    router,
    pricingRouter,
    service,
    controller,
    handleStripeSuccess: (session) => service.handleStripeSuccess(session),
    HotelBookingModel: HotelBooking,
  };
}

export { default as HotelBookingSchema } from './schemas/hotel-booking.schema.js';
