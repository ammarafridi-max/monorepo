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

/**
 * Builds the `booking` product-type handler for the shared Stripe webhook
 * dispatcher (@travel-suite/payments createStripeWebhookHandler). The dispatcher
 * has already verified the signature, enforced idempotency, and confirmed
 * payment_status === 'paid' before this runs.
 *
 * Wire it as:
 *   createStripeWebhookHandler({ stripe, webhookSecret, db, handlers: { booking: handler } })
 *
 * @param {{ db: import('mongoose').Connection, notifications?: {
 *   sendPaymentConfirmationEmailAdmin: Function,
 *   sendPaymentConfirmationEmailCustomer: Function,
 * } }} deps
 */
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

    // The payment is now persisted. Everything below is best-effort: a mail
    // provider outage must not bubble up, because the dispatcher would answer
    // 500, Stripe would redeliver, and this paid session would be reprocessed.
    // deliverPaymentConfirmations() is contractually non-throwing and records
    // the outcome on the booking so a silent failure stays findable.
    await deliverPaymentConfirmations({ Booking, booking, notifications });
  };
}
