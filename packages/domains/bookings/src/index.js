import BookingSchema              from './schema.js';
import { createBookingService }   from './service.js';
import { createBookingController } from './controller.js';
import { createBookingRouter }    from './router.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createBookingsRouter({ db }) {
  const Booking    = getOrRegisterModel(db, 'Booking', BookingSchema);
  const service    = createBookingService({ Booking });
  const controller = createBookingController({ service });
  return createBookingRouter({ controller });
}
