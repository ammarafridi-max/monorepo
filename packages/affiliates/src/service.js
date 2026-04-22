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
    if (!Number.isNaN(start.getTime())) { start.setHours(0, 0, 0, 0); range.$gte = start; }
  }
  if (query.endDate) {
    const end = new Date(query.endDate);
    if (!Number.isNaN(end.getTime())) { end.setHours(23, 59, 59, 999); range.$lte = end; }
  }
  return Object.keys(range).length ? range : null;
}

export function createAffiliateService({ Affiliate, Ticket }) {
  const createAffiliate = async (payload) => {
    if (Object.prototype.hasOwnProperty.call(payload, 'affiliateId'))
      throw new AppError('affiliateId is auto-generated and cannot be provided manually', 400);

    let affiliateId;
    try {
      affiliateId = await Affiliate.generateUniqueAffiliateId(10);
    } catch {
      throw new AppError('Could not generate a unique affiliate ID', 500);
    }

    return Affiliate.create({ ...payload, affiliateId });
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

  const deleteAffiliateById = async (id) => {
    const affiliate = await getAffiliateById(id);
    if (Ticket) {
      const linkedTickets = await Ticket.countDocuments({ affiliate: affiliate._id });
      if (linkedTickets > 0)
        throw new AppError('Affiliate cannot be deleted while linked tickets exist', 400);
    }
    await Affiliate.findByIdAndDelete(id);
    return affiliate;
  };

  const getAffiliateStatsById = async (id, query = {}) => {
    const affiliate = await getAffiliateById(id);
    const createdAtRange = buildCreatedAtRange(query);
    const match = { affiliate: affiliate._id };
    if (createdAtRange) match.createdAt = createdAtRange;

    if (!Ticket) return {
      affiliateId: affiliate.affiliateId,
      dateRange: { startDate: query.startDate || null, endDate: query.endDate || null },
      totalTickets: 0, paidTickets: 0, unpaidTickets: 0,
      paidRevenue: { currency: 'AED', amount: 0 },
      totalCommission: { currency: 'AED', amount: 0 },
    };

    const [summary] = await Ticket.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          paidTickets: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, 1, 0] } },
          unpaidTickets: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'UNPAID'] }, 1, 0] } },
          paidRevenue: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, { $ifNull: ['$amountPaid.amount', 0] }, 0] },
          },
        },
      },
    ]);

    const paidRevenueAmount = Number((summary?.paidRevenue || 0).toFixed(2));
    const totalCommissionAmount = Number(
      ((paidRevenueAmount * Number(affiliate.commissionPercent || 0)) / 100).toFixed(2),
    );

    return {
      affiliateId: affiliate.affiliateId,
      dateRange: { startDate: query.startDate || null, endDate: query.endDate || null },
      totalTickets: summary?.totalTickets || 0,
      paidTickets: summary?.paidTickets || 0,
      unpaidTickets: summary?.unpaidTickets || 0,
      paidRevenue: { currency: 'AED', amount: paidRevenueAmount },
      totalCommission: { currency: 'AED', amount: totalCommissionAmount },
    };
  };

  const getAffiliateTicketsById = async (id, query = {}) => {
    const affiliate = await getAffiliateById(id);
    let page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit, 10) || 20);

    const filter = { affiliate: affiliate._id };
    if (query.paymentStatus && ['PAID', 'UNPAID', 'REFUNDED'].includes(query.paymentStatus))
      filter.paymentStatus = query.paymentStatus;

    if (!Ticket) return { tickets: [], total: 0, page: 1, totalPages: 1, limit };

    const total = await Ticket.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    if (page > totalPages) page = totalPages;

    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('sessionId passengers email paymentStatus orderStatus amountPaid totalAmount from to departureDate returnDate createdAt');

    return {
      tickets,
      pagination: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    };
  };

  const seedAffiliates = async () => {
    const seeds = [
      { name: 'Atlas Partners', email: 'atlas.partners@example.com', commissionPercent: 12, isActive: true },
      { name: 'Blue Horizon Media', email: 'blue.horizon@example.com', commissionPercent: 18, isActive: true },
      { name: 'Northline Referrals', email: 'northline@example.com', commissionPercent: 25, isActive: false },
      { name: 'Skyline Promotions', email: 'skyline.promotions@example.com', commissionPercent: 32, isActive: true },
      { name: 'Summit Network', email: 'summit.network@example.com', commissionPercent: 40, isActive: false },
    ];

    const created = [];
    for (const payload of seeds) {
      const existing = await Affiliate.findOne({ email: payload.email });
      if (existing) { created.push(existing); continue; }
      created.push(await createAffiliate(payload));
    }
    return created;
  };

  return { createAffiliate, getAffiliates, getAffiliateById, updateAffiliateById, deleteAffiliateById, getAffiliateStatsById, getAffiliateTicketsById, seedAffiliates };
}
