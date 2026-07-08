import { Order, ORDER_STATES } from '@headliner/shared';

/**
 * Idempotent auto-refund for a FAILED order, factored out of index.js so the
 * Stripe client can be injected (real in the worker, a counting stub in tests).
 *
 * Same receipt-before-acting shape as the delivery email: refund only when
 * refundedAt is unset, and stamp it on success. A Stripe idempotency key
 * (`refund:<orderId>`) collapses any double-fire at Stripe's side to one refund.
 * Best-effort: a refund API failure is logged and surfaced via /admin/orders
 * (refundedAt stays null); it never throws.
 *
 * @param {Object} deps
 * @param {{ refunds: { create: Function } } | null} deps.stripe - Stripe client
 *        (or null in the fake path: no real money, refund skipped)
 * @returns {(orderId: string) => Promise<void>}
 */
export function createEnsureRefund({ stripe }) {
  return async function ensureRefund(orderId) {
    const order = await Order.findById(orderId);
    if (!order) return;
    if (order.status !== ORDER_STATES.FAILED) return; // only refund failed orders
    if (order.refundedAt) return; // already refunded
    if (!order.stripePaymentIntentId) return; // never paid, nothing to refund
    if (!stripe) {
      console.warn(`[worker] order ${orderId} FAILED but no Stripe client; refund skipped`);
      return;
    }

    try {
      await stripe.refunds.create(
        { payment_intent: order.stripePaymentIntentId },
        { idempotencyKey: `refund:${orderId}` }
      );
      await Order.updateOne({ _id: orderId }, { $set: { refundedAt: new Date() } });
      console.log(`[worker] order ${orderId} refunded (${order.stripePaymentIntentId})`);
    } catch (err) {
      console.error(`[worker] order ${orderId} refund failed: ${err.message}`);
    }
  };
}
