import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { AppError, logger } from '@travel-suite/utils';

const AFFILIATE_ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const AFFILIATE_CAPTURE_FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : email;
}

function parseAffiliateCapturedAt(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isAffiliateAttributionWithinWindow(capturedAt, now = new Date()) {
  if (!capturedAt) return false;
  const age = now.getTime() - capturedAt.getTime();
  if (age < -AFFILIATE_CAPTURE_FUTURE_TOLERANCE_MS) return false;
  return age <= AFFILIATE_ATTRIBUTION_TTL_MS;
}

function buildSearchFilter(search) {
  if (!search) return {};
  const regex = new RegExp(search, 'i');
  return {
    $or: [
      { 'passengers.0.firstName': regex },
      { 'passengers.0.lastName': regex },
      { 'passengers.0.title': regex },
      { email: regex },
      { from: regex },
      { to: regex },
    ],
  };
}

function applyCreatedAtFilter(queryObj, createdAt) {
  if (!createdAt) return;
  const hours = { '4_hours': 4, '6_hours': 6, '12_hours': 12, '24_hours': 24, '7_days': 168, '14_days': 336, '30_days': 720, '90_days': 2160 };
  if (!hours[createdAt]) return;
  queryObj.createdAt = { $gte: new Date(Date.now() - hours[createdAt] * 3_600_000) };
}

function getDubaiDateString() {
  const dubaiDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
  const y = dubaiDate.getFullYear();
  const m = String(dubaiDate.getMonth() + 1).padStart(2, '0');
  const d = String(dubaiDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function applyDeliveryDateFilter(queryObj, deliveryDate) {
  if (!deliveryDate) return;
  const dateStr = deliveryDate === 'today' ? getDubaiDateString() : deliveryDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
  queryObj['ticketDelivery.deliveryDate'] = { $regex: new RegExp(`^${dateStr}`) };
  // Delivery views only concern paid tickets — never show unpaid ones.
  queryObj.paymentStatus = 'PAID';
}

export function createTicketService({ Ticket, Affiliate, pricingService, currencyService, stripe, paypal, notifications, frontendUrl, brevo, reviewListId }) {
  const getAllTickets = async (query) => {
    const queryObj = { ...query };
    ['page', 'limit', 'search', 'createdAt', 'deliveryDate'].forEach((f) => delete queryObj[f]);
    Object.keys(queryObj).forEach((k) => queryObj[k] === 'all' && delete queryObj[k]);
    applyCreatedAtFilter(queryObj, query.createdAt);
    applyDeliveryDateFilter(queryObj, query.deliveryDate);
    const finalQuery = { ...queryObj, ...buildSearchFilter(query.search) };

    let page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit, 10) || 100);
    const total = await Ticket.countDocuments(finalQuery);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    if (page > totalPages) page = totalPages;

    const data = await Ticket.find(finalQuery)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('handledBy');

    return { data, pagination: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 } };
  };

  const getTicketBySessionId = (sessionId) =>
    Ticket.findOne({ sessionId })
      .populate('handledBy')
      .populate('affiliate', 'name email affiliateId commissionPercent isActive');

  const updateOrderStatus = async (sessionId, userId, orderStatus) => {
    if (!orderStatus) throw new AppError('Order status is required', 400);
    const allowed = ['PENDING', 'DELIVERED', 'PROGRESS', 'REFUNDED'];
    if (!allowed.includes(orderStatus)) throw new AppError('Invalid order status', 400);
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Invalid user ID', 400);

    const updated = await Ticket.findOneAndUpdate(
      { sessionId },
      { $set: { orderStatus, handledBy: new mongoose.Types.ObjectId(userId) } },
      { new: true },
    ).populate('handledBy');

    if (!updated) throw new AppError('Ticket not found', 404);
    return updated;
  };

  const deleteTicket = async (sessionId) => {
    const deleted = await Ticket.findOneAndDelete({ sessionId });
    if (!deleted) throw new AppError('Ticket not found', 404);
  };

  const createTicketRequest = async (payload) => {
    const normalizedEmail = normalizeEmail(payload?.email);
    const incomingAffiliateId = payload?.affiliateId;
    const isValidAffiliateId = /^\d{9}$/.test(incomingAffiliateId || '');
    const parsedCapturedAt = parseAffiliateCapturedAt(payload?.affiliateCapturedAt);
    const now = new Date();

    let affiliateDoc = null;
    let affiliateCapturedAt = null;

    const alreadyHasPaidAffiliatePurchase = normalizedEmail
      ? await Ticket.exists({ email: normalizedEmail, paymentStatus: 'PAID', affiliate: { $ne: null } })
      : false;

    if (isValidAffiliateId && !alreadyHasPaidAffiliatePurchase && isAffiliateAttributionWithinWindow(parsedCapturedAt, now)) {
      affiliateDoc = await Affiliate.findOne({ affiliateId: incomingAffiliateId, isActive: true }).select('_id affiliateId');
      if (affiliateDoc) affiliateCapturedAt = parsedCapturedAt;
    }

    return Ticket.create({
      ...payload,
      email: normalizedEmail,
      currency: String(payload?.currency || 'AED').toUpperCase(),
      sessionId: uuidv4(),
      affiliateId: affiliateDoc ? affiliateDoc.affiliateId : null,
      affiliateCapturedAt,
      affiliate: affiliateDoc ? affiliateDoc._id : null,
    });
  };

  const createStripePaymentUrl = async (formData) => {
    const { sessionId } = formData;
    if (!sessionId) throw new AppError('Session ID is required', 400);

    const ticket = await Ticket.findOne({ sessionId });
    if (!ticket) throw new AppError('Ticket not found', 404);

    const adults = Number(ticket.quantity?.adults || 0);
    const children = Number(ticket.quantity?.children || 0);
    if (adults + children < 1) throw new AppError('At least 1 passenger is required for checkout', 400);

    const { currency: baseCurrency, unitPrice } = await pricingService.getUnitPrice(ticket.ticketValidity);
    const baseTotalAmount = Number((unitPrice * (adults + children)).toFixed(2));
    const requestedCode = String(formData?.currencyCode || ticket.currency || baseCurrency || 'AED').toUpperCase();
    const { amount: totalAmount, currencyCode } = await currencyService.convertFromBase({ amount: baseTotalAmount, targetCode: requestedCode });

    await Ticket.findOneAndUpdate({ sessionId }, { $set: { totalAmount, currency: currencyCode } });

    return stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: ticket.email,
      invoice_creation: { enabled: true },
      metadata: {
        productType: 'ticket',
        entity: 'DUMMY_TICKET',
        customer: ticket.leadPassenger,
        sessionId,
        from: ticket.from,
        to: ticket.to,
        departureDate: ticket.departureDate,
        returnDate: ticket.returnDate,
      },
      line_items: [
        {
          price_data: {
            currency: String(currencyCode || 'AED').toLowerCase(),
            unit_amount: Math.round(totalAmount * 100),
            product_data: { name: `${ticket.type} Flight Reservation` },
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/booking/payment?sessionId=${sessionId}`,
      cancel_url: `${frontendUrl}/booking/review-details`,
    }, { idempotencyKey: sessionId });
  };

  const handleStripeSuccess = async (session) => {
    if (session.payment_status !== 'paid') return;

    const sessionId = session.metadata.sessionId;
    const currency = (session.currency || 'aed').toUpperCase();
    const amount = Number((session.amount_total / 100).toFixed(2));
    const transactionId = session.id;

    const existing = await Ticket.findOne({ sessionId });
    if (!existing) {
      throw new Error(`[tickets] Ticket not found for sessionId: ${sessionId}`);
    }

    // Re-validate affiliate attribution at payment time
    let shouldClearAffiliate = false;
    if (existing.affiliate || existing.affiliateId) {
      const activeAffiliate = existing.affiliate
        ? await Affiliate.findOne({ _id: existing.affiliate, isActive: true }).select('_id')
        : null;
      const withinWindow = isAffiliateAttributionWithinWindow(parseAffiliateCapturedAt(existing.affiliateCapturedAt));

      if (!activeAffiliate || !withinWindow) {
        shouldClearAffiliate = true;
      } else if (existing.affiliate && existing.email) {
        const hasPriorPaidAffiliatePurchase = await Ticket.exists({
          _id: { $ne: existing._id },
          email: normalizeEmail(existing.email),
          paymentStatus: 'PAID',
          affiliate: { $ne: null },
        });
        if (hasPriorPaidAffiliatePurchase) shouldClearAffiliate = true;
      }
    }

    const ticket = await Ticket.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          paymentStatus: 'PAID',
          amountPaid: { currency, amount },
          transactionId,
          orderStatus: 'PENDING',
          ...(shouldClearAffiliate ? { affiliate: null, affiliateId: null, affiliateCapturedAt: null } : {}),
        },
      },
      { new: true },
    );

    await notifications.sendTicketPaymentToAdmin({
      createdAt: ticket.createdAt,
      type: ticket.type,
      from: ticket.from,
      to: ticket.to,
      departureDate: ticket.departureDate,
      returnDate: ticket.returnDate,
      leadPassenger: ticket.leadPassenger,
      email: ticket.email,
      number: ticket.phoneNumber?.code && ticket.phoneNumber?.digits
        ? `${ticket.phoneNumber.code}${ticket.phoneNumber.digits}`
        : 'Not provided',
      flightDetails: ticket.flightDetails,
      ticketValidity: ticket.ticketValidity,
      ticketDelivery: ticket.ticketDelivery,
      passengers: ticket.passengers,
      message: ticket.message,
    });

    // Review collection (MDT only): no-op where brevo is not injected
    // (e.g. dt365). Best-effort — must never break a confirmed payment.
    try {
      await brevo?.addContactToReviewList?.({
        email: ticket.email,
        firstName: ticket.passengers?.[0]?.firstName ?? undefined,
        listId: reviewListId,
      });
    } catch (err) {
      logger.warn('Brevo addContactToReviewList failed', {
        email: ticket.email,
        error: err,
      });
    }
  };

  // -- PayPal ---------------------------------------------------------------

  /**
   * Creates a PayPal order for a ticket.
   * Always charges in USD (PayPal does not support AED).
   * Returns { orderId, approveUrl } — frontend redirects to approveUrl.
   */
  const createPayPalOrder = async (formData) => {
    if (!paypal) throw new AppError('PayPal is not configured', 503);

    const { sessionId } = formData;
    if (!sessionId) throw new AppError('Session ID is required', 400);

    const ticket = await Ticket.findOne({ sessionId });
    if (!ticket) throw new AppError('Ticket not found', 404);

    const adults = Number(ticket.quantity?.adults || 0);
    const children = Number(ticket.quantity?.children || 0);
    if (adults + children < 1) throw new AppError('At least 1 passenger is required for checkout', 400);

    const { currency: baseCurrency, unitPrice } = await pricingService.getUnitPrice(ticket.ticketValidity);
    const baseTotalAmount = Number((unitPrice * (adults + children)).toFixed(2));

    // PayPal doesn't support AED — always charge in USD.
    const { amount: totalAmount, currencyCode } = await currencyService.convertFromBase({
      amount: baseTotalAmount,
      targetCode: 'USD',
    });

    await Ticket.findOneAndUpdate({ sessionId }, { $set: { totalAmount, currency: currencyCode } });

    return paypal.createOrder({
      amount: totalAmount.toFixed(2),
      currency: currencyCode,
      sessionId,
      description: `${ticket.type} Flight Reservation`,
      returnUrl: `${frontendUrl}/booking/payment?sessionId=${sessionId}&paymentMethod=paypal`,
      cancelUrl: `${frontendUrl}/booking/review-details`,
    });
  };

  /**
   * Captures an approved PayPal order and marks the ticket as PAID.
   * Called from the frontend after PayPal redirects back with ?token=<orderId>.
   */
  const capturePayPalOrder = async ({ sessionId, orderId }) => {
    if (!paypal) throw new AppError('PayPal is not configured', 503);
    if (!sessionId) throw new AppError('Session ID is required', 400);
    if (!orderId) throw new AppError('PayPal order ID is required', 400);

    const existing = await Ticket.findOne({ sessionId });
    if (!existing) throw new AppError('Ticket not found', 404);

    // Idempotency — already paid (e.g. user refreshed the page)
    if (existing.paymentStatus === 'PAID') return existing;

    const captureData = await paypal.captureOrder(orderId);

    if (captureData.status !== 'COMPLETED') {
      throw new AppError(`PayPal payment not completed (status: ${captureData.status})`, 400);
    }

    const captureUnit = captureData.purchase_units?.[0];
    const capture = captureUnit?.payments?.captures?.[0];
    const amount = parseFloat(capture?.amount?.value ?? existing.totalAmount ?? 0);
    const currency = (capture?.amount?.currency_code ?? existing.currency ?? 'USD').toUpperCase();
    const transactionId = captureData.id; // PayPal Order ID

    // Re-validate affiliate attribution at payment time (same logic as Stripe)
    let shouldClearAffiliate = false;
    if (existing.affiliate || existing.affiliateId) {
      const activeAffiliate = existing.affiliate
        ? await Affiliate.findOne({ _id: existing.affiliate, isActive: true }).select('_id')
        : null;
      const withinWindow = isAffiliateAttributionWithinWindow(
        parseAffiliateCapturedAt(existing.affiliateCapturedAt),
      );

      if (!activeAffiliate || !withinWindow) {
        shouldClearAffiliate = true;
      } else if (existing.affiliate && existing.email) {
        const hasPriorPaidAffiliatePurchase = await Ticket.exists({
          _id: { $ne: existing._id },
          email: normalizeEmail(existing.email),
          paymentStatus: 'PAID',
          affiliate: { $ne: null },
        });
        if (hasPriorPaidAffiliatePurchase) shouldClearAffiliate = true;
      }
    }

    const ticket = await Ticket.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          paymentStatus: 'PAID',
          paymentMethod: 'paypal',
          amountPaid: { currency, amount },
          transactionId,
          orderStatus: 'PENDING',
          ...(shouldClearAffiliate ? { affiliate: null, affiliateId: null, affiliateCapturedAt: null } : {}),
        },
      },
      { new: true },
    );

    await notifications.sendTicketPaymentToAdmin({
      createdAt: ticket.createdAt,
      type: ticket.type,
      from: ticket.from,
      to: ticket.to,
      departureDate: ticket.departureDate,
      returnDate: ticket.returnDate,
      leadPassenger: ticket.leadPassenger,
      email: ticket.email,
      number:
        ticket.phoneNumber?.code && ticket.phoneNumber?.digits
          ? `${ticket.phoneNumber.code}${ticket.phoneNumber.digits}`
          : 'Not provided',
      flightDetails: ticket.flightDetails,
      ticketValidity: ticket.ticketValidity,
      ticketDelivery: ticket.ticketDelivery,
      passengers: ticket.passengers,
      message: ticket.message,
    });

    return ticket;
  };

  const refundByTransactionId = async (transactionId) => {
    const ticket = await Ticket.findOne({ transactionId });
    if (!ticket) throw new AppError('Ticket not found', 404);
    if (ticket.paymentStatus !== 'PAID') throw new AppError('Payment not completed', 400);

    const session = await stripe.checkout.sessions.retrieve(ticket.transactionId);
    if (!session.payment_intent) throw new AppError('PaymentIntent not found', 400);

    const refund = await stripe.refunds.create({ payment_intent: session.payment_intent });

    await Ticket.findOneAndUpdate(
      { transactionId },
      { $set: { paymentStatus: 'REFUNDED', orderStatus: 'REFUNDED' } },
      { new: true },
    );

    return refund;
  };

  return { getAllTickets, getTicketBySessionId, updateOrderStatus, deleteTicket, createTicketRequest, createStripePaymentUrl, handleStripeSuccess, createPayPalOrder, capturePayPalOrder, refundByTransactionId };
}
