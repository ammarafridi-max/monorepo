import { Order, ORDER_STATES } from '@travel-suite/picturesk-shared';

export function createEnsureRefund({ stripe }) {
  return async function ensureRefund(orderId) {
    const order = await Order.findById(orderId);
    if (!order) return;
    if (order.status !== ORDER_STATES.FAILED) return; 
    if (order.refundedAt) return; 
    if (!order.stripePaymentIntentId) return; 
    if (!stripe) {
      console.warn(
        `[worker] order ${orderId} FAILED but no Stripe client; refund skipped`,
      );
      return;
    }

    try {
      await stripe.refunds.create(
        { payment_intent: order.stripePaymentIntentId },
        { idempotencyKey: `refund:${orderId}` },
      );
      await Order.updateOne(
        { _id: orderId },
        { $set: { refundedAt: new Date() } },
      );
      console.log(
        `[worker] order ${orderId} refunded (${order.stripePaymentIntentId})`,
      );
    } catch (err) {
      console.error(`[worker] order ${orderId} refund failed: ${err.message}`);
    }
  };
}
