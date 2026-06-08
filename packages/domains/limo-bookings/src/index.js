import { VehicleSchema } from '@travel-suite/vehicles';
import { ZoneSchema } from '@travel-suite/zones';
import { PricingRuleSchema } from '@travel-suite/pricing-rules';
import { AvailabilityRuleSchema } from '@travel-suite/availability-rules';
import BookingSchema from './schema.js';
import { createBookingPricingService } from './pricing.service.js';
import { createBookingService } from './service.js';
import { createBookingController } from './controller.js';
import { createBookingRouterFromParts } from './router.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

/**
 * @param db          Mongoose connection
 * @param auth        { protect, restrictTo } from @travel-suite/auth
 * @param stripe      Stripe client from @travel-suite/payments createStripeClient
 * @param frontendUrl Public site origin used for Stripe success/cancel URLs
 */
export function createBookingsRouter({ db, auth, stripe, frontendUrl }) {
  getOrRegisterModel(db, 'Vehicle', VehicleSchema);
  getOrRegisterModel(db, 'Zone', ZoneSchema);
  const PricingRule = getOrRegisterModel(db, 'PricingRule', PricingRuleSchema);
  const AvailabilityRule = getOrRegisterModel(db, 'AvailabilityRule', AvailabilityRuleSchema);
  const Booking = getOrRegisterModel(db, 'Booking', BookingSchema);

  const pricing = createBookingPricingService({ AvailabilityRule, PricingRule });
  const service = createBookingService({ Booking, stripe, frontendUrl, pricing });
  const controller = createBookingController({ service });
  return createBookingRouterFromParts({ controller, auth });
}

export { createBookingPaymentHandler } from './webhook.js';
export { BookingSchema };
