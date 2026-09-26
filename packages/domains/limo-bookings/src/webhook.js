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

export function createBookingPaymentHandler({ db, notifications, metaCapi, frontendUrl }) {
  const Booking = getOrRegisterModel(db, 'Booking', BookingSchema);

  // Never throws: a Meta outage must not fail the webhook and make Stripe resend a paid booking.
  const reportPurchaseToMeta = async (booking) => {
    if (!metaCapi?.isConfigured?.()) return;
    const { firstName, lastName, email, phoneNumber } = booking.bookingDetails || {};
    const phone = phoneNumber?.code && phoneNumber?.number ? `${phoneNumber.code}${phoneNumber.number}` : undefined;
    try {
      await metaCapi.trackPurchase({
        eventId: `limo-booking:${booking._id}`,
        eventSourceUrl: frontendUrl ? `${frontendUrl}/payment` : undefined,
        value: booking.payment.amount,
        currency: booking.payment.currency,
        user: {
          email,
          phone,
          firstName,
          lastName,
          externalId: email?.toLowerCase(),
          clientIp: booking.metaAttribution?.clientIp,
          userAgent: booking.metaAttribution?.userAgent,
          fbp: booking.metaAttribution?.fbp,
          fbc: booking.metaAttribution?.fbc,
        },
      });
    } catch (err) {
      logger.warn('[limo-bookings] Meta purchase event failed', { bookingId: String(booking._id), error: err.message });
    }
  };

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

    await reportPurchaseToMeta(booking);
  };
}
