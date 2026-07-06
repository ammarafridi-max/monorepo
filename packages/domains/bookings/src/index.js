import BookingSchema               from './schema.js';
import { createBookingService }    from './service.js';
import { createBookingController } from './controller.js';
import { createBookingRouter }     from './router.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createBookingsRouter({ db, stripe }) {
  const Booking    = getOrRegisterModel(db, 'Booking', BookingSchema);
  const service    = createBookingService({ Booking, stripe });
  const controller = createBookingController({ service });
  const router     = createBookingRouter({ controller });
  return { router, service, controller };
}
