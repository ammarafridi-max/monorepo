import { Router } from 'express';
import mongoose from 'mongoose';
import { Order, ORDER_STATES } from '@travel-suite/picturesk-shared';
import { AppError, catchAsync } from '@travel-suite/utils';

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


const STUCK_AFTER_MS = (Number(process.env.ADMIN_STUCK_MINUTES) || 30) * 60 * 1000;
const NON_TERMINAL = [
  ORDER_STATES.AWAITING_PAYMENT,
  ORDER_STATES.PAID,
  ORDER_STATES.TRAINING,
  ORDER_STATES.GENERATING,
];

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
      return null; 
  }
}

function stuckFilter() {
  const cutoff = new Date(Date.now() - STUCK_AFTER_MS);
  const enteredAt = {
    [ORDER_STATES.AWAITING_PAYMENT]: ['$createdAt'],
    [ORDER_STATES.PAID]: ['$paidAt', '$createdAt'],
    [ORDER_STATES.TRAINING]: ['$trainingStartedAt', '$paidAt', '$createdAt'],
    [ORDER_STATES.GENERATING]: ['$generatingStartedAt', '$createdAt'],
  };
  const firstSet = (fields) =>
    fields.length === 1 ? fields[0] : { $ifNull: [fields[0], firstSet(fields.slice(1))] };
  return {
    $or: Object.entries(enteredAt).map(([state, fields]) => ({
      status: state,
      $expr: { $lt: [firstSet(fields), cutoff] },
    })),
  };
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

function toAdminOrder(order) {
  const ms = stuckForMs(order);
  return {
    orderId: order._id.toString(),
    status: order.status,
    product: order.product ?? 'headshots',
    tier: order.tier ?? null,
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

function toAdminOrderDetail(order) {
  const ms = stuckForMs(order);
  return {
    orderId: order._id.toString(),
    status: order.status,
    product: order.product ?? 'headshots',
    tier: order.tier ?? null,
    customerEmail: order.customerEmail,
    userId: order.userId ? order.userId.toString() : null,
    reuseFromOrderId: order.reuseFromOrderId ? order.reuseFromOrderId.toString() : null,

    amountPaidCents: order.amountPaidCents ?? null,
    computeCostCents: order.computeCostCents ?? 0,
    marginCents: marginCents(order),

    selectedLooks: order.selectedLooks ?? [],
    selectedAttire: order.selectedAttire ?? [],
    gender: order.gender ?? null,
    ageRange: order.ageRange ?? null,
    race: order.race ?? null,
    build: order.build ?? null,
    height: order.height ?? null,
    facialHair: order.facialHair ?? null,
    derivedFacialHair: order.derivedFacialHair ?? null,

    uploadedImageUrls: order.uploadedImageUrls ?? [],
    resultImageUrls: order.resultImageUrls ?? [],
    candidateScores: order.candidateScores ?? [],
    swappedImageUrls: order.swappedImageUrls ?? [],
    enhancedImageUrls: order.enhancedImageUrls ?? [],
    deliveredImageUrls: order.deliveredImageUrls ?? [],

    replicate: order.replicate ?? null,
    stripeSessionId: order.stripeSessionId ?? null,
    stripePaymentIntentId: order.stripePaymentIntentId ?? null,

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

export function createAdminDataRouter({ guard, restrictTo }) {
  const router = Router();

  router.use(guard, restrictTo('admin', 'support'));

  router.get(
    '/orders',
    catchAsync(async (req, res) => {
      const { status } = req.query;
      if (status && !Object.values(ORDER_STATES).includes(status)) {
        throw new AppError(`unknown status ${status}`, 400);
      }
      const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 25, 1), 100);
      const filter = status ? { status } : {};

      const search = String(req.query.search ?? '').trim();
      if (search) {
        const or = [{ customerEmail: new RegExp(escapeRegex(search), 'i') }];
        if (mongoose.isValidObjectId(search)) or.push({ _id: search });
        filter.$or = or;
      }
      if (req.query.stuck === '1') Object.assign(filter, stuckFilter());

      const [total, orders, stuckCount, [totals]] = await Promise.all([
        Order.countDocuments(filter),
        Order.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Order.countDocuments(stuckFilter()),
        Order.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              delivered: {
                $sum: { $cond: [{ $eq: ['$status', ORDER_STATES.DELIVERED] }, 1, 0] },
              },
              paidCents: { $sum: { $ifNull: ['$amountPaidCents', 0] } },
              marginCents: {
                $sum: {
                  $cond: [
                    { $eq: ['$status', ORDER_STATES.DELIVERED] },
                    {
                      $subtract: [
                        { $ifNull: ['$amountPaidCents', 0] },
                        { $ifNull: ['$computeCostCents', 0] },
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
        ]),
      ]);
      res.json({
        status: 'success',
        data: {
          count: orders.length,
          stuckCount,
          stuckAfterMinutes: STUCK_AFTER_MS / 60000,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          },
          totals: {
            delivered: totals?.delivered ?? 0,
            paidCents: totals?.paidCents ?? 0,
            marginCents: totals?.marginCents ?? 0,
          },
          orders: orders.map(toAdminOrder),
        },
      });
    })
  );

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
          revenueCents: totals.revenueCents,
          computeCostCents: totals.computeCostCents,
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

  router.get(
    '/customers',
    catchAsync(async (req, res) => {
      const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 200, 1), 500);
      const search = String(req.query.search ?? '').trim();
      const rows = await Order.aggregate([
        ...(search
          ? [{ $match: { customerEmail: new RegExp(escapeRegex(search), 'i') } }]
          : []),
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

  return router;
}
