import mongoose from 'mongoose';
import { AppError } from '@travel-suite/utils';

function buildSearchFilter(q) {
  if (!q) return {};
  const escaped = String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!escaped) return {};
  const regex = new RegExp(escaped, 'i');
  return { $or: [{ name: regex }, { email: regex }, { affiliateId: regex }] };
}

function parseBooleanFilter(value) {
  if (value === undefined) return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
}

function parseSort(sort = 'newest') {
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name_asc: { name: 1 },
    name_desc: { name: -1 },
    commission_asc: { commissionPercent: 1 },
    commission_desc: { commissionPercent: -1 },
  };
  return sortMap[sort] ?? { createdAt: -1 };
}

function buildCreatedAtRange(query = {}) {
  const range = {};
  if (query.startDate) {
    const start = new Date(query.startDate);
    if (!Number.isNaN(start.getTime())) { start.setUTCHours(0, 0, 0, 0); range.$gte = start; }
  }
  if (query.endDate) {
    const end = new Date(query.endDate);
    if (!Number.isNaN(end.getTime())) { end.setUTCHours(23, 59, 59, 999); range.$lte = end; }
  }
  return Object.keys(range).length ? range : null;
}

function utcDayStart(value) {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

const AFFILIATE_ID_PATTERN = /^\d{9}$/;

const IS_PAID = { $eq: ['$paymentStatus', 'PAID'] };

function missingField(path) {
  return { $eq: [{ $ifNull: [path, null] }, null] };
}

async function aggregateStats(Model, match) {
  const [summary] = await Model.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        paid: { $sum: { $cond: [IS_PAID, 1, 0] } },
        unpaid: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'UNPAID'] }, 1, 0] } },
        refunded: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'REFUNDED'] }, 1, 0] } },
        baseRevenue: {
          $sum: { $cond: [IS_PAID, { $ifNull: ['$amountPaidBase.amount', 0] }, 0] },
        },
        commission: {
          $sum: { $cond: [IS_PAID, { $ifNull: ['$affiliateCommission.amount', 0] }, 0] },
        },
        unconvertedPaid: {
          $sum: { $cond: [{ $and: [IS_PAID, missingField('$amountPaidBase.amount')] }, 1, 0] },
        },
        uncommissionedPaid: {
          $sum: { $cond: [{ $and: [IS_PAID, missingField('$affiliateCommission.amount')] }, 1, 0] },
        },
      },
    },
  ]);
  return {
    total: summary?.total || 0,
    paid: summary?.paid || 0,
    unpaid: summary?.unpaid || 0,
    refunded: summary?.refunded || 0,
    baseRevenue: summary?.baseRevenue || 0,
    commission: summary?.commission || 0,
    unconvertedPaid: summary?.unconvertedPaid || 0,
    uncommissionedPaid: summary?.uncommissionedPaid || 0,
  };
}

export function createAffiliateService({
  Affiliate,
  AffiliateClick = null,
  AffiliatePayout = null,
  Ticket,
  InsuranceApplication,
  resolveCurrencyModel = () => null,
  notifications = null,
  trackingBaseUrl = null,
  logger = null,
}) {
  const logFailure = logger?.error?.bind(logger) ?? console.error;

  const buildTrackingLink = (affiliateId) => {
    if (!trackingBaseUrl || !affiliateId) return null;
    return `${String(trackingBaseUrl).replace(/\/+$/, '')}/?affId=${affiliateId}`;
  };

  const sendWelcomeEmail = async (affiliate) => {
    if (!notifications?.sendAffiliateWelcome || !affiliate?.email) return;
    try {
      await notifications.sendAffiliateWelcome({
        email: affiliate.email,
        name: affiliate.name,
        affiliateId: affiliate.affiliateId,
        commissionPercent: affiliate.commissionPercent,
        trackingLink: buildTrackingLink(affiliate.affiliateId),
      });
    } catch (err) {
      logFailure('[affiliates] welcome email failed', {
        affiliateId: affiliate.affiliateId,
        err: err.message,
      });
    }
  };

  const resolveBaseCurrencyCode = async () => {
    const Currency = resolveCurrencyModel();
    if (!Currency) return null;
    const base = await Currency.findOne({ isBaseCurrency: true }).select('code').lean();
    return base?.code ?? null;
  };

  const createAffiliate = async (payload) => {
    if (Object.prototype.hasOwnProperty.call(payload, 'affiliateId'))
      throw new AppError('affiliateId is auto-generated and cannot be provided manually', 400);

    let affiliateId;
    try {
      affiliateId = await Affiliate.generateUniqueAffiliateId(10);
    } catch {
      throw new AppError('Could not generate a unique affiliate ID', 500);
    }

    const affiliate = await Affiliate.create({ ...payload, affiliateId });
    await sendWelcomeEmail(affiliate);
    return affiliate;
  };

  const getAffiliates = async (query = {}) => {
    let page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit, 10) || 20);

    const filter = { ...buildSearchFilter(query.q || query.search) };
    const isActive = parseBooleanFilter(query.isActive);
    if (typeof isActive === 'boolean') filter.isActive = isActive;

    const total = await Affiliate.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    if (page > totalPages) page = totalPages;

    const affiliates = await Affiliate.find(filter)
      .sort(parseSort(query.sort))
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      affiliates,
      pagination: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    };
  };

  const getAffiliateById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid affiliate ID', 400);
    const affiliate = await Affiliate.findById(id);
    if (!affiliate) throw new AppError('Affiliate not found', 404);
    return affiliate;
  };

  const updateAffiliateById = async (id, payload) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid affiliate ID', 400);
    const affiliate = await Affiliate.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!affiliate) throw new AppError('Affiliate not found', 404);
    return affiliate;
  };

  const findLinkedLabels = async (affiliate) => {
    const linkedToAffiliate = {
      $or: [{ affiliate: affiliate._id }, { affiliateId: affiliate.affiliateId }],
    };
    const labelled = [
      [Ticket, 'tickets'],
      [InsuranceApplication, 'insurance applications'],
      [AffiliatePayout, 'payout records'],
    ];
    const labels = [];
    for (const [Model, label] of labelled) {
      if (!Model) continue;
      if (await Model.exists(linkedToAffiliate)) labels.push(label);
    }
    return labels;
  };

  const linkedError = (labels) =>
    new AppError(`Affiliate cannot be deleted while linked ${labels.join(' and ')} exist`, 400);

  const deleteAffiliateById = async (id) => {
    const affiliate = await getAffiliateById(id);

    const wasActive = affiliate.isActive !== false;
    await Affiliate.updateOne({ _id: affiliate._id }, { $set: { isActive: false } });

    const restoreActiveFlag = async () => {
      if (wasActive) await Affiliate.updateOne({ _id: affiliate._id }, { $set: { isActive: true } });
    };

    const linked = await findLinkedLabels(affiliate);
    if (linked.length) {
      await restoreActiveFlag();
      throw linkedError(linked);
    }

    const removed = await Affiliate.findByIdAndDelete(affiliate._id).lean();
    if (!removed) throw new AppError('Affiliate not found', 404);

    const linkedAfterDelete = await findLinkedLabels(affiliate);
    if (linkedAfterDelete.length) {
      await Affiliate.collection.insertOne(removed);
      await restoreActiveFlag();
      throw linkedError(linkedAfterDelete);
    }

    if (AffiliateClick) await AffiliateClick.deleteMany({ affiliate: affiliate._id });

    return affiliate;
  };

  const recordClick = async (rawAffiliateId) => {
    if (!AffiliateClick) return false;

    const affiliateId = String(rawAffiliateId ?? '').trim();
    if (!AFFILIATE_ID_PATTERN.test(affiliateId)) return false;

    const affiliate = await Affiliate.findOne({ affiliateId, isActive: true })
      .select('_id affiliateId')
      .lean();
    if (!affiliate) return false;

    const filter = { affiliate: affiliate._id, date: utcDayStart(Date.now()) };

    try {
      await AffiliateClick.updateOne(
        filter,
        { $inc: { count: 1 }, $setOnInsert: { affiliateId: affiliate.affiliateId } },
        { upsert: true },
      );
    } catch (err) {
      if (err?.code !== 11000) throw err;
      await AffiliateClick.updateOne(filter, { $inc: { count: 1 } });
    }

    return true;
  };

  const countClicks = async (affiliateObjectId, dateRange) => {
    if (!AffiliateClick) return null;
    const match = { affiliate: affiliateObjectId };
    if (dateRange) match.date = dateRange;
    const [row] = await AffiliateClick.aggregate([
      { $match: match },
      { $group: { _id: null, clicks: { $sum: '$count' } } },
    ]);
    return row?.clicks || 0;
  };

  const getAffiliateStatsById = async (id, query = {}) => {
    const affiliate = await getAffiliateById(id);
    const createdAtRange = buildCreatedAtRange(query);
    const match = { affiliate: affiliate._id };
    if (createdAtRange) match.createdAt = createdAtRange;

    const commissionableTypes = [];
    if (Ticket) commissionableTypes.push('ticket');
    if (InsuranceApplication) commissionableTypes.push('insurance');

    let ticketStats = null;
    if (Ticket) {
      ticketStats = await aggregateStats(Ticket, match);
    }

    let insuranceStats = null;
    if (InsuranceApplication) {
      insuranceStats = await aggregateStats(InsuranceApplication, match);
    }

    const baseCurrency = await resolveBaseCurrencyCode();
    const clicks = await countClicks(affiliate._id, createdAtRange);

    const totalPaidRevenue = Number((
      (ticketStats?.baseRevenue || 0) + (insuranceStats?.baseRevenue || 0)
    ).toFixed(2));
    const totalCommissionAmount = Number((
      (ticketStats?.commission || 0) + (insuranceStats?.commission || 0)
    ).toFixed(2));
    const unconvertedPaid =
      (ticketStats?.unconvertedPaid || 0) + (insuranceStats?.unconvertedPaid || 0);
    const uncommissionedPaid =
      (ticketStats?.uncommissionedPaid || 0) + (insuranceStats?.uncommissionedPaid || 0);

    const paidConversions = (ticketStats?.paid || 0) + (insuranceStats?.paid || 0);
    const conversionRate =
      clicks > 0 ? Number(((paidConversions / clicks) * 100).toFixed(2)) : null;

    return {
      affiliateId: affiliate.affiliateId,
      dateRange: { startDate: query.startDate || null, endDate: query.endDate || null },
      commissionableTypes,

      ...(ticketStats !== null && {
        totalTickets: ticketStats.total,
        paidTickets: ticketStats.paid,
        unpaidTickets: ticketStats.unpaid,
        refundedTickets: ticketStats.refunded,
      }),

      ...(insuranceStats !== null && {
        totalApplications: insuranceStats.total,
        paidApplications: insuranceStats.paid,
        unpaidApplications: insuranceStats.unpaid,
        refundedApplications: insuranceStats.refunded,
      }),

      ...(clicks !== null && { clicks, paidConversions, conversionRate }),

      paidRevenue: { currency: baseCurrency, amount: totalPaidRevenue },
      totalCommission: { currency: baseCurrency, amount: totalCommissionAmount },
      excluded: { unconvertedPaid, uncommissionedPaid },
    };
  };

  const getAffiliateTicketsById = async (id, query = {}) => {
    const affiliate = await getAffiliateById(id);
    let page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit, 10) || 20);

    const filter = { affiliate: affiliate._id };
    if (query.paymentStatus && ['PAID', 'UNPAID', 'REFUNDED'].includes(query.paymentStatus))
      filter.paymentStatus = query.paymentStatus;

    if (!Ticket) return { tickets: [], pagination: { total: 0, page: 1, totalPages: 1, limit } };

    const total = await Ticket.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    if (page > totalPages) page = totalPages;

    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('sessionId passengers email paymentStatus orderStatus amountPaid totalAmount from to departureDate returnDate createdAt affiliateCommission affiliateCommissionPercent amountPaidBase');

    return {
      tickets,
      pagination: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    };
  };

  const getAffiliateApplicationsById = async (id, query = {}) => {
    const affiliate = await getAffiliateById(id);
    let page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit, 10) || 20);

    const filter = { affiliate: affiliate._id };
    if (query.paymentStatus && ['PAID', 'UNPAID', 'REFUNDED'].includes(query.paymentStatus))
      filter.paymentStatus = query.paymentStatus;

    if (!InsuranceApplication) return { applications: [], pagination: { total: 0, page: 1, totalPages: 1, limit } };

    const total = await InsuranceApplication.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    if (page > totalPages) page = totalPages;

    const applications = await InsuranceApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('sessionId email journeyType paymentStatus amountPaid passengers startDate endDate region createdAt affiliateCommission affiliateCommissionPercent amountPaidBase');

    return {
      applications,
      pagination: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    };
  };

  return {
    createAffiliate,
    getAffiliates,
    getAffiliateById,
    updateAffiliateById,
    deleteAffiliateById,
    recordClick,
    getAffiliateStatsById,
    getAffiliateTicketsById,
    getAffiliateApplicationsById,
  };
}
