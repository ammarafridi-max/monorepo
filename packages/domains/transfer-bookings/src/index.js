import TransferBookingSchema      from './schema.js';
import { createTransferBookingService }    from './service.js';
import { createTransferBookingController } from './controller.js';
import { createBookingRouter }     from './router.js';
import { getOrRegisterModel } from '@travel-suite/utils/model';

export function createTransferBookingsRouter({ db, stripe, auth }) {
  const TransferBooking = getOrRegisterModel(db, 'transfer-booking', TransferBookingSchema);
  const service    = createTransferBookingService({ Booking: TransferBooking, stripe });
  const controller = createTransferBookingController({ service });
  const router     = createBookingRouter({ controller, auth });
  return { router, service, controller };
}
