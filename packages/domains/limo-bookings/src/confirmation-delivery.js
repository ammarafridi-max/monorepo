import { logger } from '@travel-suite/utils';

const BASE = 'notifications.paymentConfirmation';

/**
 * Run one notifier and normalise whatever it does into a delivery result.
 *
 * Notifiers are injected by the brand app, so this must survive all three of
 * the shapes they can produce: a `{ ok, error }` result, a bare return (the
 * older contract, where "it didn't throw" was the only success signal), and a
 * thrown error. Nothing here rethrows — the caller is inside a Stripe webhook.
 */
async function attempt(notify, booking) {
  if (typeof notify !== 'function') return null;
  try {
    const result = await notify({ booking });
    if (result && typeof result === 'object' && 'ok' in result) {
      return result.ok
        ? { ok: true }
        : { ok: false, error: String(result.error || 'Email send reported failure') };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message ? String(err.message) : String(err) };
  }
}

function updateFor(key, result, now) {
  const set = {
    [`${BASE}.${key}.status`]: result.ok ? 'sent' : 'failed',
    [`${BASE}.${key}.lastAttemptAt`]: now,
    [`${BASE}.${key}.lastError`]: result.ok ? null : result.error.slice(0, 1000),
  };
  if (result.ok) set[`${BASE}.${key}.sentAt`] = now;
  return set;
}

/**
 * Send the payment-confirmation emails for a paid booking and record on the
 * booking whether each one actually went out.
 *
 * Contract: this NEVER throws and NEVER rejects. It is called from the Stripe
 * webhook after the payment has already been persisted, and a rejection there
 * would make the dispatcher return 500, Stripe retry the event, and the
 * payment be reprocessed — a far worse failure than an unsent email. Every
 * failure path (send, persist) degrades to a log line plus a recorded status.
 *
 * The record is written with updateOne + dotted paths rather than
 * booking.save() so it touches only these fields: the in-memory doc is stale
 * the moment an admin edits the booking concurrently, and a full save would
 * also re-run validation on unrelated legacy fields.
 *
 * @param {{ Booking: import('mongoose').Model, booking: object, notifications?: {
 *   sendPaymentConfirmationEmailAdmin?: Function,
 *   sendPaymentConfirmationEmailCustomer?: Function,
 * } }} deps
 * @returns {Promise<{ admin: {ok: boolean, error?: string}|null, customer: {ok: boolean, error?: string}|null }>}
 */
export async function deliverPaymentConfirmations({ Booking, booking, notifications }) {
  const results = { admin: null, customer: null };

  try {
    results.admin = await attempt(notifications?.sendPaymentConfirmationEmailAdmin, booking);
    results.customer = await attempt(notifications?.sendPaymentConfirmationEmailCustomer, booking);

    const now = new Date();
    const $set = {};
    const $inc = {};
    for (const key of ['admin', 'customer']) {
      if (!results[key]) continue;
      Object.assign($set, updateFor(key, results[key], now));
      $inc[`${BASE}.${key}.attempts`] = 1;
    }

    if (Object.keys($set).length) {
      await Booking.updateOne({ _id: booking._id }, { $set, $inc });
    }

    const failed = ['admin', 'customer'].filter((k) => results[k] && !results[k].ok);
    if (failed.length) {
      logger.error('[limo-bookings] Payment confirmation email(s) not delivered', {
        bookingId: String(booking._id),
        bookingRef: booking.bookingRef,
        failed,
        errors: failed.map((k) => results[k].error),
      });
    }
  } catch (err) {
    // Recording the failure must not itself become a webhook failure.
    logger.error('[limo-bookings] Could not record confirmation delivery state', {
      bookingId: String(booking?._id),
      error: err?.message,
    });
  }

  return results;
}
