import HotelBookingSchema from './schemas/hotel-booking.schema.js';
import HotelBookingPricingSchema from './schemas/pricing.schema.js';
import { createHotelBookingService } from './service.js';
import { createCurrencyConversionService } from '@travel-suite/currencies/conversion';
import { createHotelPricingService } from './pricing.service.js';
import { createHotelBookingController } from './controller.js';
import { createHotelBookingRouter, createHotelPricingRouter } from './router.js';
import { createPaidOrderBus } from './paidOrderBus.js';
import { getOrRegisterModel } from '@travel-suite/utils/model';


export function createHotelBookingsRouter({
  db,
  auth,
  stripe,
  hotelSearch,
  citySuggest,
  notifications,
  frontendUrl,
  AffiliateModel,
  CurrencyModel,
  paidOrderBus: injectedBus,
  reservationStorage,
  sendEmail,
}) {
  const HotelBooking = getOrRegisterModel(db, 'hotel-booking', HotelBookingSchema);
  const HotelBookingPricing = getOrRegisterModel(db, 'hotel-booking-pricing', HotelBookingPricingSchema);

  const conversionService = CurrencyModel
    ? createCurrencyConversionService({ Currency: CurrencyModel })
    : null;
  const pricingService = createHotelPricingService({
    HotelBookingPricing,
    Currency: CurrencyModel,
    conversionService,
  });
  const paidOrderBus = injectedBus ?? createPaidOrderBus();

  const service = createHotelBookingService({
    HotelBooking,
    Affiliate: AffiliateModel,
    hotelSearch,
    citySuggest,
    pricingService,
    stripe,
    notifications,
    frontendUrl,
    paidOrderBus,
    reservationStorage,
    sendEmail,
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
