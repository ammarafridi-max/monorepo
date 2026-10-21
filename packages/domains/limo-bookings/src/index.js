import { VehicleSchema } from '@travel-suite/vehicles';
import { ZoneSchema } from '@travel-suite/zones';
import { PricingRuleSchema } from '@travel-suite/pricing-rules';
import { AvailabilityRuleSchema } from '@travel-suite/availability-rules';
import BookingSchema from './schema.js';
import { createBookingPricingService } from './pricing.service.js';
import { createBookingService } from './service.js';
import { createBookingController } from './controller.js';
import { createBookingRouterFromParts } from './router.js';
import { getOrRegisterModel } from '@travel-suite/utils/model';


export function createBookingsRouter({ db, auth, stripe, frontendUrl }) {
  getOrRegisterModel(db, 'vehicle', VehicleSchema);
  getOrRegisterModel(db, 'zone', ZoneSchema);
  const PricingRule = getOrRegisterModel(db, 'pricing-rule', PricingRuleSchema);
  const AvailabilityRule = getOrRegisterModel(db, 'availability-rule', AvailabilityRuleSchema);
  const Booking = getOrRegisterModel(db, 'booking', BookingSchema);

  const pricing = createBookingPricingService({ AvailabilityRule, PricingRule });
  const service = createBookingService({ Booking, stripe, frontendUrl, pricing });
  const controller = createBookingController({ service });
  return createBookingRouterFromParts({ controller, auth });
}

export { createBookingPaymentHandler } from './webhook.js';
export { deliverPaymentConfirmations } from './confirmation-delivery.js';
export { BookingSchema };
