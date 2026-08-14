import { logger } from '@travel-suite/utils';

const BASE = 'notifications.paymentConfirmation';

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

// Never throws: a rejection would 500 the Stripe webhook and get the payment reprocessed. Writes via updateOne + dotted paths, not save().
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
    logger.error('[limo-bookings] Could not record confirmation delivery state', {
      bookingId: String(booking?._id),
      error: err?.message,
    });
  }

  return results;
}
