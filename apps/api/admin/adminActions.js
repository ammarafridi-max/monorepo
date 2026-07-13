import { Router } from 'express';
import { Order, ORDER_STATES } from '@picturesk/shared';
import { AppError, catchAsync, adminErrorHandler } from './errors.js';

/**
 * Admin ORDER ACTIONS (the write side): refund, retry, resend delivery email.
 * ADMIN-ONLY and mounted at /admin BEFORE the read-only data router. Guards are
 * per-route (not a blanket router.use), so a non-action request (e.g. GET /orders)
 * falls straight through to the data router without tripping restrictTo('admin')
 * and without running the auth guard twice.
 *
 *   POST /admin/orders/:id/refund        issue a Stripe refund, stamp refundedAt
 *   POST /admin/orders/:id/retry         re-enqueue the pipeline (stuck orders)
 *   POST /admin/orders/:id/resend-email  re-send the delivery email (delivered)
 *
 * @param {Object} deps
 * @param {Function} deps.guard              combined admin guard (cookie or token)
 * @param {(...roles:string[])=>Function} deps.restrictTo
 * @param {{ refunds:{ create:Function } }|null} deps.stripe
 * @param {{ add:Function, remove:Function }} deps.orderPipeline  BullMQ queue
 * @param {(orderId:string)=>object} deps.pipelineJobOpts
 * @param {{ sendDeliveryEmail:Function }|null} deps.emailClient
 * @param {{ keyForUrl:Function, deleteObjects:Function }|null} deps.storage  R2 client (or null if unconfigured)
 * @param {string} deps.webBaseUrl
 */
export function createAdminActionsRouter({
  guard,
  restrictTo,
  stripe,
  orderPipeline,
  pipelineJobOpts,
  emailClient,
  storage,
  webBaseUrl,
}) {
  const router = Router();
  const adminOnly = [guard, restrictTo('admin')];

  // Orders that can be re-queued: paid and mid-pipeline. Terminal (DELIVERED/
  // FAILED) and unpaid (AWAITING_PAYMENT) are excluded.
  const RETRYABLE = [ORDER_STATES.PAID, ORDER_STATES.TRAINING, ORDER_STATES.GENERATING];

  async function findOrder(id) {
    let order;
    try {
      order = await Order.findById(id);
    } catch {
      throw new AppError('invalid order id', 400);
    }
    if (!order) throw new AppError('order not found', 404);
    return order;
  }

  // Refund. Idempotent + safe: only when a captured payment exists and it is not
  // already refunded; the Stripe idempotency key collapses any double-fire to one.
  // Does not change the order status (refundedAt is independent); an in-flight
  // pipeline is not cancelled, so refund a stuck order together with a retry only
  // if you intend to let it keep running.
  router.post(
    '/orders/:id/refund',
    ...adminOnly,
    catchAsync(async (req, res) => {
      const order = await findOrder(req.params.id);
      if (order.refundedAt) throw new AppError('This order was already refunded.', 409);
      if (!order.stripePaymentIntentId) throw new AppError('No captured payment to refund.', 400);
      if (!stripe) throw new AppError('Stripe is not configured on this service.', 503);

      const orderId = order._id.toString();
      await stripe.refunds.create(
        { payment_intent: order.stripePaymentIntentId },
        { idempotencyKey: `refund:${orderId}` }
      );
      await Order.updateOne({ _id: orderId }, { $set: { refundedAt: new Date() } });
      res.json({ status: 'success', message: 'Refund issued.' });
    })
  );

  // Retry: re-enqueue the pipeline job so the worker reattaches. jobId = orderId
  // keeps it idempotent; we remove any finished/failed job with that id first so a
  // fresh run is accepted. The worker itself is idempotent (never retrains or
  // regenerates a started slot), so this is safe to press more than once.
  router.post(
    '/orders/:id/retry',
    ...adminOnly,
    catchAsync(async (req, res) => {
      const order = await findOrder(req.params.id);
      if (!RETRYABLE.includes(order.status)) {
        throw new AppError(
          `Only a paid, in-progress order can be retried (this one is ${order.status}).`,
          400
        );
      }
      const orderId = order._id.toString();
      await orderPipeline.remove(orderId).catch(() => {});
      await orderPipeline.add('process-order', { orderId }, pipelineJobOpts(orderId));
      res.json({ status: 'success', message: 'Re-queued. The worker will pick it up and reattach.' });
    })
  );

  // Resend the delivery email for a delivered order (same content the worker sends).
  router.post(
    '/orders/:id/resend-email',
    ...adminOnly,
    catchAsync(async (req, res) => {
      const order = await findOrder(req.params.id);
      if (order.status !== ORDER_STATES.DELIVERED) {
        throw new AppError('Only a delivered order has results to email.', 400);
      }
      if (!emailClient) throw new AppError('Email is not configured (BREVO_API_KEY unset).', 503);

      const orderId = order._id.toString();
      await emailClient.sendDeliveryEmail({
        to: order.customerEmail,
        resultsUrl: `${webBaseUrl}/success?orderId=${orderId}`,
        orderId,
        thumbnailUrls: order.deliveredImageUrls ?? [],
      });
      await Order.updateOne({ _id: orderId }, { $set: { deliveredEmailSentAt: new Date() } });
      res.json({ status: 'success', message: `Delivery email re-sent to ${order.customerEmail}.` });
    })
  );

  // Delete an order AND the objects WE store for it: the uploaded selfies and the
  // training zip in R2. The AI-generated images (result/delivered/swapped/enhanced)
  // live on Replicate (replicate.delivery) and expire on their own, so they are not
  // ours to delete; keyForUrl returns null for them and they are skipped. Hard
  // delete and irreversible: the order (its payment/audit record) is gone. Any
  // queued pipeline job is removed first so the worker never touches a deleted order.
  router.delete(
    '/orders/:id',
    ...adminOnly,
    catchAsync(async (req, res) => {
      const order = await findOrder(req.params.id);
      const orderId = order._id.toString();

      await orderPipeline.remove(orderId).catch(() => {});

      let storageResult = { deleted: 0, failed: 0, skipped: false };
      if (storage) {
        const urls = [
          ...(order.uploadedImageUrls ?? []),
          ...(order.resultImageUrls ?? []),
          ...(order.deliveredImageUrls ?? []),
          ...(order.swappedImageUrls ?? []),
          ...(order.enhancedImageUrls ?? []),
        ];
        const keys = urls.map((u) => storage.keyForUrl(u)).filter(Boolean);
        keys.push(`training/${orderId}.zip`);
        storageResult = { ...(await storage.deleteObjects(keys)), skipped: false };
      } else {
        storageResult.skipped = true;
      }

      await Order.deleteOne({ _id: orderId });

      res.json({
        status: 'success',
        message: 'Order deleted.',
        data: {
          deletedObjects: storageResult.deleted,
          failedObjects: storageResult.failed,
          storageSkipped: storageResult.skipped,
        },
      });
    })
  );

  router.use(adminErrorHandler);
  return router;
}
