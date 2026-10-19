import mongoose from 'mongoose';
import { AppError } from '@travel-suite/utils';

const DAY_MS = 24 * 60 * 60 * 1000;
const IS_PAID = { $eq: ['$paymentStatus', 'PAID'] };
const IS_REFUNDED = { $eq: ['$paymentStatus', 'REFUNDED'] };

export function parsePeriod(period) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(period ?? '').trim());
  if (!match) throw new AppError('Period must be in YYYY-MM format', 400);

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) throw new AppError('Period month must be between 01 and 12', 400);

  return {
    periodStart: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
    periodEnd: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
  };
}

export function createAffiliatePayoutService({
  Affiliate,
  AffiliatePayout,
  Ticket,
  resolveCurrencyModel = () => null,
  holdDays = 0,
  notifications = null,
  logger = null,
}) {
  const logFailure = logger?.error?.bind(logger) ?? console.error;

  const periodLabel = (periodStart) => {
    if (!periodStart) return null;
    try {
      return new Intl.DateTimeFormat('en-GB', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(periodStart));
    } catch {
      return null;
    }
  };

  const sendStatementEmail = async (payout) => {
    if (!notifications?.sendAffiliatePayoutStatement) return;
    try {
      const affiliate = await Affiliate.findById(payout.affiliate).select('name email').lean();
      if (!affiliate?.email) return;

      await notifications.sendAffiliatePayoutStatement({
        email: affiliate.email,
        name: affiliate.name,
        affiliateId: payout.affiliateId,
        periodStart: payout.periodStart,
        periodEnd: payout.periodEnd,
        periodLabel: periodLabel(payout.periodStart),
        currency: payout.currency,
        commissionAmount: payout.commissionAmount,
        revenueAmount: payout.revenueAmount,
        orderCount: payout.orderCount,
        absorbedRefundCount: payout.absorbedRefundCount,
        absorbedRefundAmount: payout.absorbedRefundAmount,
        paidAt: payout.paidAt,
        reference: payout.reference,
        note: payout.note,
      });
    } catch (err) {
      logFailure('[affiliates] payout statement email failed', {
        payoutId: String(payout?._id ?? ''),
        err: err.message,
      });
    }
  };

  const requireTickets = () => {
    if (!Ticket) throw new AppError('Affiliate payouts require the tickets model', 500);
  };

  const baseCurrencyCode = async () => {
    const Currency = resolveCurrencyModel();
    if (!Currency) return null;
    const base = await Currency.findOne({ isBaseCurrency: true }).select('code').lean();
    return base?.code ?? null;
  };

  const totalsFor = async (payoutId) => {
    const [agg] = await Ticket.aggregate([
      { $match: { affiliatePayout: payoutId } },
      {
        $group: {
          _id: null,
          orderCount: { $sum: { $cond: [IS_PAID, 1, 0] } },
          commissionAmount: {
            $sum: { $cond: [IS_PAID, { $ifNull: ['$affiliateCommission.amount', 0] }, 0] },
          },
          revenueAmount: {
            $sum: { $cond: [IS_PAID, { $ifNull: ['$amountPaidBase.amount', 0] }, 0] },
          },
          absorbedRefundCount: { $sum: { $cond: [IS_REFUNDED, 1, 0] } },
          absorbedRefundAmount: {
            $sum: { $cond: [IS_REFUNDED, { $ifNull: ['$affiliateCommission.amount', 0] }, 0] },
          },
        },
      },
    ]);

    const round = (value) => Number(Number(value || 0).toFixed(2));
    return {
      orderCount: agg?.orderCount || 0,
      commissionAmount: round(agg?.commissionAmount),
      revenueAmount: round(agg?.revenueAmount),
      absorbedRefundCount: agg?.absorbedRefundCount || 0,
      absorbedRefundAmount: round(agg?.absorbedRefundAmount),
    };
  };

  const syncPayout = async (payout) => {
    const totals = await totalsFor(payout._id);

    const update =
      payout.status === 'PENDING'
        ? totals
        : {
            absorbedRefundCount: totals.absorbedRefundCount,
            absorbedRefundAmount: totals.absorbedRefundAmount,
          };

    return AffiliatePayout.findByIdAndUpdate(payout._id, { $set: update }, { returnDocument: 'after' });
  };

  const generateForPeriod = async ({ period, now = new Date() }) => {
    requireTickets();
    const { periodStart, periodEnd } = parsePeriod(period);
    if (periodStart > now) throw new AppError('Cannot generate payouts for a future period', 400);

    const holdCutoff = new Date(now.getTime() - holdDays * DAY_MS);
    const windowEnd = periodEnd < holdCutoff ? periodEnd : holdCutoff;
    if (windowEnd < periodStart) {
      return { period, periodStart, periodEnd, holdDays, payouts: [], skipped: 'hold period not yet elapsed' };
    }

    const eligible = {
      affiliate: { $ne: null },
      affiliatePayout: null,
      paymentStatus: 'PAID',
      'affiliateCommission.amount': { $ne: null },
      paidAt: { $gte: periodStart, $lte: windowEnd },
    };

    const affiliateIds = await Ticket.distinct('affiliate', eligible);
    const currency = await baseCurrencyCode();
    const results = new Map();

    for (const affiliateObjectId of affiliateIds) {
      const affiliate = await Affiliate.findById(affiliateObjectId).select('affiliateId').lean();
      if (!affiliate?.affiliateId) continue;

      let payout = await AffiliatePayout.findOneAndUpdate(
        { affiliate: affiliateObjectId, periodStart },
        {
          $setOnInsert: {
            affiliate: affiliateObjectId,
            affiliateId: affiliate.affiliateId,
            periodStart,
            periodEnd,
            currency,
            status: 'PENDING',
          },
        },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
      );

      if (payout.status === 'PAID') continue;

      if (payout.status === 'VOID') {
        payout =
          (await AffiliatePayout.findOneAndUpdate(
            { _id: payout._id, status: 'VOID' },
            { $set: { status: 'PENDING', currency } },
            { returnDocument: 'after' },
          )) ?? payout;
        if (payout.status !== 'PENDING') continue;
      }

      const claim = await Ticket.updateMany(
        { ...eligible, affiliate: affiliateObjectId },
        { $set: { affiliatePayout: payout._id } },
      );

      payout = await syncPayout(payout);
      results.set(String(payout._id), claim.modifiedCount ?? 0);
    }

    const payouts = await AffiliatePayout.find({ periodStart })
      .sort({ commissionAmount: -1 })
      .populate('affiliate', 'name email affiliateId commissionPercent isActive');

    return {
      period,
      periodStart,
      periodEnd,
      holdDays,
      payouts: payouts.map((payout) => ({
        payoutId: payout._id,
        affiliateId: payout.affiliateId,
        status: payout.status,
        currency: payout.currency,
        orderCount: payout.orderCount,
        commissionAmount: payout.commissionAmount,
        absorbedRefundAmount: payout.absorbedRefundAmount,
        claimed: results.get(String(payout._id)) ?? 0,
      })),
    };
  };

  const getPayouts = async (query = {}) => {
    let page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit, 10) || 20);

    const filter = {};
    if (query.status && ['PENDING', 'PAID', 'VOID'].includes(String(query.status).toUpperCase()))
      filter.status = String(query.status).toUpperCase();
    if (query.affiliateId) filter.affiliateId = String(query.affiliateId).trim();
    if (query.period) filter.periodStart = parsePeriod(query.period).periodStart;

    const total = await AffiliatePayout.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    if (page > totalPages) page = totalPages;

    const payouts = await AffiliatePayout.find(filter)
      .sort({ periodStart: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('affiliate', 'name email affiliateId commissionPercent isActive');

    return {
      payouts,
      pagination: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    };
  };

  const getPayoutById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid payout ID', 400);
    const payout = await AffiliatePayout.findById(id);
    if (!payout) throw new AppError('Payout not found', 404);

    requireTickets();
    const synced = await syncPayout(payout);
    return AffiliatePayout.populate(synced, {
      path: 'affiliate',
      select: 'name email affiliateId commissionPercent isActive',
    });
  };

  const markPayoutPaid = async (id, { reference, note } = {}) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid payout ID', 400);
    requireTickets();

    const payout = await AffiliatePayout.findById(id);
    if (!payout) throw new AppError('Payout not found', 404);
    if (payout.status === 'PAID') throw new AppError('Payout is already marked paid', 409);
    if (payout.status === 'VOID') throw new AppError('A void payout cannot be marked paid', 409);

    const totals = await totalsFor(payout._id);
    if (totals.commissionAmount <= 0)
      throw new AppError('Payout has no payable commission', 400);

    const settled = await AffiliatePayout.findOneAndUpdate(
      { _id: payout._id, status: 'PENDING' },
      {
        $set: {
          ...totals,
          status: 'PAID',
          paidAt: new Date(),
          reference: reference ? String(reference).trim() : null,
          note: note ? String(note).trim() : null,
        },
      },
      { returnDocument: 'after' },
    );
    if (!settled) throw new AppError('Payout was modified concurrently, please retry', 409);
    await sendStatementEmail(settled);
    return settled;
  };

  const voidPayout = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid payout ID', 400);
    requireTickets();

    const payout = await AffiliatePayout.findById(id);
    if (!payout) throw new AppError('Payout not found', 404);
    if (payout.status === 'PAID') throw new AppError('A paid payout cannot be voided', 409);
    if (payout.status === 'VOID') return payout;

    const released = await AffiliatePayout.findOneAndUpdate(
      { _id: payout._id, status: 'PENDING' },
      {
        $set: {
          status: 'VOID',
          commissionAmount: 0,
          revenueAmount: 0,
          orderCount: 0,
          absorbedRefundCount: 0,
          absorbedRefundAmount: 0,
        },
      },
      { returnDocument: 'after' },
    );
    if (!released) throw new AppError('Payout was modified concurrently, please retry', 409);

    await Ticket.updateMany({ affiliatePayout: released._id }, { $set: { affiliatePayout: null } });
    return released;
  };

  return { generateForPeriod, getPayouts, getPayoutById, markPayoutPaid, voidPayout };
}
