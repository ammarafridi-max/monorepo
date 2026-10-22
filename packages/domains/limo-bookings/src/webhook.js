import { logger } from '@travel-suite/utils';
import { fromStripeMinorUnits } from '@travel-suite/utils/currency';
import BookingSchema from './schema.js';
import { deliverPaymentConfirmations } from './confirmation-delivery.js';
import { getOrRegisterModel } from '@travel-suite/utils/model';


export function createBookingPaymentHandler({ db, notifications, metaCapi, frontendUrl }) {
  const Booking = getOrRegisterModel(db, 'booking', BookingSchema);

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
    const paidCurrency = session.currency ? session.currency.toUpperCase() : booking.payment.currency;
    booking.payment.amount = session.amount_total
      ? fromStripeMinorUnits(session.amount_total, paidCurrency)
      : booking.payment.amount;
    booking.payment.currency = paidCurrency;
    booking.status = 'pending';
    await booking.save();

    await deliverPaymentConfirmations({ Booking, booking, notifications });

    await reportPurchaseToMeta(booking);
  };
}
