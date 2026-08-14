import { logger } from '@travel-suite/utils';
import BookingSchema from './schema.js';
import { deliverPaymentConfirmations } from './confirmation-delivery.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createBookingPaymentHandler({ db, notifications }) {
  const Booking = getOrRegisterModel(db, 'Booking', BookingSchema);

  return async (session) => {
    const bookingId = session.metadata?.bookingId;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      logger.warn('[limo-bookings] Booking not found for paid session', { bookingId });
      return;
    }

    booking.payment.status = 'paid';
    booking.payment.transactionId = session.id;
    booking.payment.amount = session.amount_total ? session.amount_total / 100 : booking.payment.amount;
    booking.payment.currency = session.currency ? session.currency.toUpperCase() : booking.payment.currency;
    booking.status = 'pending';
    await booking.save();

    await deliverPaymentConfirmations({ Booking, booking, notifications });
  };
}
