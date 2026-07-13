import { Router } from 'express';
import { Order, ORDER_STATES } from '@picturesk/shared';
import { AppError, catchAsync, adminErrorHandler } from './errors.js';

/**
 * Phase B: the READ-ONLY admin data surface, mounted at /admin. Every route is
 * behind the injected `guard` (admin cookie session OR the ADMIN_TOKEN break-glass
 * header) and `restrictTo('admin','support')` — both staff roles can view.
 *
 *   GET /admin/orders        list (optional ?status, ?limit), with stuck + margin
 *   GET /admin/orders/:id     full detail (images, replicate ids, scores, error)
 *   GET /admin/stats          revenue / compute cost / margin / counts / stuck
 *   GET /admin/customers      per-email order counts, spend, last order, account?
 *
 * The projections live here (not the public server routes) so nothing customer-
 * facing can ever accidentally return margin/Stripe/Replicate internals.
 */

const STUCK_AFTER_MS = (Number(process.env.ADMIN_STUCK_MINUTES) || 30) * 60 * 1000;
const NON_TERMINAL = [
  ORDER_STATES.AWAITING_PAYMENT,
  ORDER_STATES.PAID,
  ORDER_STATES.TRAINING,
  ORDER_STATES.GENERATING,
];

// When did the order ENTER its current state? Used to measure how long it has
// been sitting there (only meaningful for non-terminal states).
function enteredCurrentStateAt(order) {
  switch (order.status) {
    case ORDER_STATES.AWAITING_PAYMENT:
      return order.createdAt;
    case ORDER_STATES.PAID:
      return order.paidAt || order.createdAt;
    case ORDER_STATES.TRAINING:
      return order.trainingStartedAt || order.paidAt || order.createdAt;
    case ORDER_STATES.GENERATING:
      return order.generatingStartedAt || order.createdAt;
    default:
      return null; // terminal: DELIVERED / FAILED
  }
}

function stuckForMs(order) {
  const enteredAt = enteredCurrentStateAt(order);
  return enteredAt ? Date.now() - new Date(enteredAt).getTime() : null;
}

function marginCents(order) {
  return order.status === ORDER_STATES.DELIVERED && typeof order.amountPaidCents === 'number'
    ? order.amountPaidCents - (order.computeCostCents || 0)
    : null;
}

/** The LIST projection: one row per order, enough to scan for stalls + margin. */
function toAdminOrder(order) {
  const ms = stuckForMs(order);
  return {
    orderId: order._id.toString(),
    status: order.status,
    customerEmail: order.customerEmail,
    amountPaidCents: order.amountPaidCents ?? null,
    computeCostCents: order.computeCostCents ?? 0,
    marginCents: marginCents(order),
    stuckForMs: ms,
    stuckForMinutes: ms == null ? null : Math.round(ms / 60000),
    stuck: ms != null && ms > STUCK_AFTER_MS,
    createdAt: order.createdAt,
    paidAt: order.paidAt ?? null,
    deliveredAt: order.deliveredAt ?? null,
    failedAt: order.failedAt ?? null,
    refundedAt: order.refundedAt ?? null,
  };
}

/** The DETAIL projection: everything an admin needs to debug one order. */
function toAdminOrderDetail(order) {
  const ms = stuckForMs(order);
  return {
    orderId: order._id.toString(),
    status: order.status,
    customerEmail: order.customerEmail,
    userId: order.userId ? order.userId.toString() : null,

    amountPaidCents: order.amountPaidCents ?? null,
    computeCostCents: order.computeCostCents ?? 0,
    marginCents: marginCents(order),

    // The customer's choices.
    selectedLooks: order.selectedLooks ?? [],
    selectedAttire: order.selectedAttire ?? [],
    gender: order.gender ?? null,
    ageRange: order.ageRange ?? null,
    race: order.race ?? null,
    facialHair: order.facialHair ?? null,
    derivedFacialHair: order.derivedFacialHair ?? null,

    // Every image artifact, in pipeline order.
    uploadedImageUrls: order.uploadedImageUrls ?? [],
    resultImageUrls: order.resultImageUrls ?? [],
    candidateScores: order.candidateScores ?? [],
    swappedImageUrls: order.swappedImageUrls ?? [],
    enhancedImageUrls: order.enhancedImageUrls ?? [],
    deliveredImageUrls: order.deliveredImageUrls ?? [],

    // External job + payment ids (admin-only; never in the public view).
    replicate: order.replicate ?? null,
    stripeSessionId: order.stripeSessionId ?? null,
    stripePaymentIntentId: order.stripePaymentIntentId ?? null,

    // Lifecycle.
    stuckForMs: ms,
    stuckForMinutes: ms == null ? null : Math.round(ms / 60000),
    stuck: ms != null && ms > STUCK_AFTER_MS,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    paidAt: order.paidAt ?? null,
    trainingStartedAt: order.trainingStartedAt ?? null,
    generatingStartedAt: order.generatingStartedAt ?? null,
    deliveredAt: order.deliveredAt ?? null,
    failedAt: order.failedAt ?? null,
    deliveredEmailSentAt: order.deliveredEmailSentAt ?? null,
    refundedAt: order.refundedAt ?? null,
    error: order.error ?? null,
  };
}

/**
 * @param {{ guard: Function, restrictTo: (...roles: string[]) => Function }} deps
 * @returns {import('express').Router}
 */
export function createAdminDataRouter({ guard, restrictTo }) {
  const router = Router();

  // Every route below is read-only staff access.
  router.use(guard, restrictTo('admin', 'support'));

  // GET /admin/orders  --  operational list, newest first. ?status filters, ?limit caps.
  router.get(
    '/orders',
    catchAsync(async (req, res) => {
      const { status } = req.query;
      if (status && !Object.values(ORDER_STATES).includes(status)) {
        throw new AppError(`unknown status ${status}`, 400);
      }
      const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 200, 1), 500);
      const filter = status ? { status } : {};
      const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(limit);
      const items = orders.map(toAdminOrder);
      res.json({
        status: 'success',
        data: {
          count: items.length,
          stuckCount: items.filter((o) => o.stuck).length,
          stuckAfterMinutes: STUCK_AFTER_MS / 60000,
          orders: items,
        },
      });
    })
  );

  // GET /admin/orders/:id  --  full detail for one order.
  router.get(
    '/orders/:id',
    catchAsync(async (req, res) => {
      let order;
      try {
        order = await Order.findById(req.params.id);
      } catch {
        throw new AppError('invalid order id', 400);
      }
      if (!order) throw new AppError('order not found', 404);
      res.json({ status: 'success', data: toAdminOrderDetail(order) });
    })
  );

  // GET /admin/stats  --  revenue / compute cost / margin / counts / stuck.
  router.get(
    '/stats',
    catchAsync(async (req, res) => {
      const [byStatusRaw, totalsRaw, deliveredTotalsRaw, refundedCount, activeOrders] =
        await Promise.all([
          Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
          Order.aggregate([
            {
              $group: {
                _id: null,
                revenueCents: { $sum: { $ifNull: ['$amountPaidCents', 0] } },
                computeCostCents: { $sum: { $ifNull: ['$computeCostCents', 0] } },
              },
            },
          ]),
          Order.aggregate([
            { $match: { status: ORDER_STATES.DELIVERED } },
            {
              $group: {
                _id: null,
                deliveredRevenueCents: { $sum: { $ifNull: ['$amountPaidCents', 0] } },
                deliveredComputeCents: { $sum: { $ifNull: ['$computeCostCents', 0] } },
                count: { $sum: 1 },
              },
            },
          ]),
          Order.countDocuments({ refundedAt: { $ne: null } }),
          // Non-terminal orders are few; load them to count stalls precisely with
          // the same per-state definition the list uses.
          Order.find({ status: { $in: NON_TERMINAL } }).select(
            'status createdAt paidAt trainingStartedAt generatingStartedAt'
          ),
        ]);

      const byStatus = Object.fromEntries(Object.values(ORDER_STATES).map((s) => [s, 0]));
      for (const row of byStatusRaw) byStatus[row._id] = row.count;

      const totals = totalsRaw[0] || { revenueCents: 0, computeCostCents: 0 };
      const dt = deliveredTotalsRaw[0] || {
        deliveredRevenueCents: 0,
        deliveredComputeCents: 0,
        count: 0,
      };
      const stuckCount = activeOrders.filter((o) => {
        const ms = stuckForMs(o);
        return ms != null && ms > STUCK_AFTER_MS;
      }).length;

      const totalOrders = Object.values(byStatus).reduce((a, b) => a + b, 0);

      res.json({
        status: 'success',
        data: {
          totalOrders,
          byStatus,
          // All figures integer cents; divide by 100 at display time.
          revenueCents: totals.revenueCents,
          computeCostCents: totals.computeCostCents,
          // Realized margin: only on DELIVERED orders (the compute actually ran).
          deliveredCount: dt.count,
          deliveredRevenueCents: dt.deliveredRevenueCents,
          deliveredMarginCents: dt.deliveredRevenueCents - dt.deliveredComputeCents,
          refundedCount,
          stuckCount,
          stuckAfterMinutes: STUCK_AFTER_MS / 60000,
        },
      });
    })
  );

  // GET /admin/customers  --  one row per customer email: orders, delivered, spend.
  router.get(
    '/customers',
    catchAsync(async (req, res) => {
      const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 200, 1), 500);
      const rows = await Order.aggregate([
        {
          $group: {
            _id: '$customerEmail',
            orders: { $sum: 1 },
            delivered: { $sum: { $cond: [{ $eq: ['$status', ORDER_STATES.DELIVERED] }, 1, 0] } },
            totalPaidCents: { $sum: { $ifNull: ['$amountPaidCents', 0] } },
            lastOrderAt: { $max: '$createdAt' },
            hasAccount: { $max: { $cond: [{ $ifNull: ['$userId', false] }, 1, 0] } },
          },
        },
        { $sort: { lastOrderAt: -1 } },
        { $limit: limit },
      ]);

      const customers = rows.map((r) => ({
        email: r._id,
        orders: r.orders,
        delivered: r.delivered,
        totalPaidCents: r.totalPaidCents,
        lastOrderAt: r.lastOrderAt,
        hasAccount: Boolean(r.hasAccount),
      }));
      res.json({ status: 'success', data: { count: customers.length, customers } });
    })
  );

  router.use(adminErrorHandler);
  return router;
}
