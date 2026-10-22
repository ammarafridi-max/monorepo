import TransferBookingSchema      from './schema.js';
import { createBookingService }    from './service.js';
import { createBookingController } from './controller.js';
import { createBookingRouter }     from './router.js';
import { getOrRegisterModel } from '@travel-suite/utils/model';

export function createTransferBookingsRouter({ db, stripe, auth }) {
  const TransferBooking = getOrRegisterModel(db, 'transfer-booking', TransferBookingSchema);
  const service    = createBookingService({ Booking: TransferBooking, stripe });
  const controller = createBookingController({ service });
  const router     = createBookingRouter({ controller, auth });
  return { router, service, controller };
}
