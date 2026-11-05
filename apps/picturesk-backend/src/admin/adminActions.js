import { Router } from 'express';
import { getTier, Order, ORDER_STATES } from '@travel-suite/picturesk-shared';
import { AppError, catchAsync } from '@travel-suite/utils';

export function createAdminActionsRouter({
  guard,
  restrictTo,
  stripe,
  orderPipeline,
  pipelineJobOpts,
  emailClient,
  storage,
  deleteTrainedModel,
  webBaseUrl,
}) {
  const router = Router();
  const adminOnly = [guard, restrictTo('admin')];

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
      const { priority } = getTier(order.tier);
      await orderPipeline.add('process-order', { orderId }, pipelineJobOpts(orderId, priority));
      res.json({ status: 'success', message: 'Re-queued. The worker will pick it up and reattach.' });
    })
  );

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
        resultsUrl: `${webBaseUrl}/success?orderId=${orderId}${
          order.publicToken ? `&t=${order.publicToken}` : ''
        }`,
        orderId,
        thumbnailUrls: order.deliveredImageUrls ?? [],
      });
      await Order.updateOne({ _id: orderId }, { $set: { deliveredEmailSentAt: new Date() } });
      res.json({ status: 'success', message: `Delivery email re-sent to ${order.customerEmail}.` });
    })
  );

  async function deleteOneOrder(order) {
    const orderId = order._id.toString();

    await orderPipeline.remove(orderId).catch(() => {});

    let storageResult = { deleted: 0, failed: 0, skipped: false, model: 'skipped' };
    if (storage) {
      const urls = [
        ...(order.uploadedImageUrls ?? []),
        ...(order.resultImageUrls ?? []),
        ...(order.deliveredImageUrls ?? []),
        ...(order.swappedImageUrls ?? []),
        ...(order.enhancedImageUrls ?? []),
        order.replicate?.weightsUrl,
      ];
      const keys = urls.map((u) => storage.keyForUrl(u)).filter(Boolean);
      keys.push(`training/${orderId}.zip`);
      storageResult = { ...storageResult, ...(await storage.deleteObjects(keys)) };
    } else {
      storageResult.skipped = true;
    }

    const version = order.replicate?.trainedModelVersion;
    if (version && deleteTrainedModel) {
      try {
        await deleteTrainedModel(version);
        storageResult.model = 'deleted';
      } catch (err) {
        console.warn(`[admin] order ${orderId}: model delete failed (${err.message})`);
        storageResult.model = 'failed';
      }
    } else if (!version) {
      storageResult.model = 'none';
    }

    await Order.deleteOne({ _id: orderId });
    return storageResult;
  }

  const MAX_BULK = 100;

  router.post(
    '/orders/bulk-delete',
    ...adminOnly,
    catchAsync(async (req, res) => {
      const ids = req.body?.ids;
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError('Provide an array of order ids to delete', 400);
      }
      const unique = [...new Set(ids.map(String))];
      if (unique.length > MAX_BULK) {
        throw new AppError(`Delete at most ${MAX_BULK} orders at a time`, 400);
      }

      const results = [];
      for (const id of unique) {
        try {
          const order = await findOrder(id);
          const storageResult = await deleteOneOrder(order);
          results.push({
            orderId: id,
            deleted: true,
            deletedObjects: storageResult.deleted,
            failedObjects: storageResult.failed,
            storageSkipped: storageResult.skipped,
            model: storageResult.model,
          });
        } catch (err) {
          results.push({ orderId: id, deleted: false, error: err.message });
        }
      }

      const totals = results.reduce(
        (acc, r) => ({
          deleted: acc.deleted + (r.deleted ? 1 : 0),
          deletedObjects: acc.deletedObjects + (r.deletedObjects ?? 0),
          failedObjects: acc.failedObjects + (r.failedObjects ?? 0),
        }),
        { deleted: 0, deletedObjects: 0, failedObjects: 0 },
      );
      const deleted = totals.deleted;
      const failed = results.length - deleted;

      res.json({
        status: 'success',
        message:
          failed === 0
            ? `${deleted} order${deleted === 1 ? '' : 's'} deleted.`
            : `${deleted} deleted, ${failed} failed.`,
        data: {
          requested: unique.length,
          deleted,
          failed,
          deletedObjects: totals.deletedObjects,
          failedObjects: totals.failedObjects,
          results,
        },
      });
    })
  );

  router.delete(
    '/orders/:id',
    ...adminOnly,
    catchAsync(async (req, res) => {
      const order = await findOrder(req.params.id);
      const storageResult = await deleteOneOrder(order);

      res.json({
        status: 'success',
        message: 'Order deleted.',
        data: {
          deletedObjects: storageResult.deleted,
          failedObjects: storageResult.failed,
          storageSkipped: storageResult.skipped,
          model: storageResult.model,
        },
      });
    })
  );

  return router;
}
