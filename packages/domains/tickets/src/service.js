import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { AppError, logger, sanitizeAttribution, attributionChannelFilter } from '@travel-suite/utils';
import {
  fromStripeMinorUnits,
  normalizeCurrencyCode,
  roundToCurrency,
  toStripeMinorUnits,
} from '@travel-suite/utils/currency';
import { payPalCurrencyFor } from '@travel-suite/paypal';
import { TICKET_VALIDITIES, VALIDITY_DAYS, SHORTEST_VALIDITY } from './validity.js';

const AFFILIATE_ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const AFFILIATE_CAPTURE_FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
const MAX_PASSENGERS = 20;
const MAX_SEGMENTS = 8;
const MAX_MESSAGE_LENGTH = 2000;

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

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function trimmedString(value) {
  return typeof value === 'string' ? value.trim() : undefined;
}

function nonNegativeInteger(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

function pickPassengers(passengers) {
  if (!Array.isArray(passengers)) return [];
  return passengers.slice(0, MAX_PASSENGERS).map((p) => ({
    type: trimmedString(p?.type),
    title: trimmedString(p?.title),
    firstName: trimmedString(p?.firstName),
    lastName: trimmedString(p?.lastName),
  }));
}

function pickSegment(segment) {
  return {
    departure: {
      iataCode: trimmedString(segment?.departure?.iataCode),
      date: trimmedString(segment?.departure?.date),
      time: trimmedString(segment?.departure?.time),
    },
    arrival: {
      iataCode: trimmedString(segment?.arrival?.iataCode),
      date: trimmedString(segment?.arrival?.date),
      time: trimmedString(segment?.arrival?.time),
    },
    duration: trimmedString(segment?.duration),
    carrierCode: trimmedString(segment?.carrierCode),
    flightNumber: trimmedString(segment?.flightNumber),
    aircraftCode: trimmedString(segment?.aircraftCode),
    airline: {
      name: trimmedString(segment?.airline?.name),
      logo: trimmedString(segment?.airline?.logo),
    },
  };
}

function pickFlight(flight) {
  if (!flight || typeof flight !== 'object' || !Array.isArray(flight.segments)) return null;
  const segments = flight.segments.slice(0, MAX_SEGMENTS).map(pickSegment);
  if (segments.length === 0) return null;
  return { duration: trimmedString(flight.duration), segments };
}

function pickCurrencyCode(value) {
  return normalizeCurrencyCode(value);
}

function pickTicketInput(payload = {}) {
  return {
    type: payload.type === 'Return' ? 'Return' : 'One Way',
    from: trimmedString(payload.from),
    to: trimmedString(payload.to),
    departureDate: trimmedString(payload.departureDate),
    returnDate: trimmedString(payload.returnDate) || undefined,
    quantity: {
      adults: nonNegativeInteger(payload.quantity?.adults),
      children: nonNegativeInteger(payload.quantity?.children),
      infants: nonNegativeInteger(payload.quantity?.infants),
    },
    passengers: pickPassengers(payload.passengers),
    email: trimmedString(payload.email),
    phoneNumber: {
      code: trimmedString(payload.phoneNumber?.code),
      digits: trimmedString(payload.phoneNumber?.digits),
    },
    message: trimmedString(payload.message)?.slice(0, MAX_MESSAGE_LENGTH),
    ticketValidity: payload.ticketValidity,
    ticketDelivery: {
      immediate: Boolean(payload.ticketDelivery?.immediate),
      deliveryDate: payload.ticketDelivery?.immediate
        ? null
        : trimmedString(payload.ticketDelivery?.deliveryDate) || null,
    },
    flightDetails: {
      departureFlight: pickFlight(payload.flightDetails?.departureFlight),
      returnFlight: pickFlight(payload.flightDetails?.returnFlight),
    },
  };
}

function buildSearchFilter(search) {
  if (!search) return {};
  const term = String(search).trim();
  if (!term) return {};
  const regex = new RegExp(escapeRegex(term), 'i');
  const digits = term.replace(/\D/g, '');
  return {
    $or: [
      { 'passengers.firstName': regex },
      { 'passengers.lastName': regex },
      { email: regex },
      { from: regex },
      { to: regex },
      { sessionId: regex },
      ...(digits.length >= 4 ? [{ 'phoneNumber.digits': new RegExp(escapeRegex(digits)) }] : []),
    ],
  };
}

const FILTERABLE_FIELDS = {
  paymentStatus: ['UNPAID', 'PAID', 'REFUNDED'],
  orderStatus: ['PENDING', 'DELIVERED', 'PROGRESS', 'REFUNDED'],
  type: ['One Way', 'Return'],
  ticketValidity: TICKET_VALIDITIES,
  paymentMethod: ['stripe', 'paypal'],
};

const MAX_PAGE_LIMIT = 200;

function buildFieldFilters(query = {}) {
  const filters = {};
  Object.entries(FILTERABLE_FIELDS).forEach(([field, allowed]) => {
    const value = query[field];
    if (typeof value === 'string' && allowed.includes(value)) filters[field] = value;
  });
  if (typeof query.affiliateId === 'string' && /^\d{9}$/.test(query.affiliateId)) {
    filters.affiliateId = query.affiliateId;
  }
  return filters;
}

const RECENCY_HOURS = { '4_hours': 4, '6_hours': 6, '12_hours': 12, '24_hours': 24, '7_days': 168, '14_days': 336, '30_days': 720, '90_days': 2160 };

function buildRecencyFilter(window, paidOnly) {
  const hours = RECENCY_HOURS[window];
  if (!hours) return null;
  const since = new Date(Date.now() - hours * 3_600_000);
  if (paidOnly) return { paidAt: { $gte: since } };
  return { $or: [{ createdAt: { $gte: since } }, { paidAt: { $gte: since } }] };
}

function getDubaiDateString() {
  const dubaiDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
  const y = dubaiDate.getFullYear();
  const m = String(dubaiDate.getMonth() + 1).padStart(2, '0');
  const d = String(dubaiDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}


function dateOnly(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : '';
}

function daysBetweenDateOnly(fromStr, toStr) {
  const from = Date.parse(`${fromStr}T00:00:00Z`);
  const to = Date.parse(`${toStr}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.round((to - from) / 86_400_000);
}

function assertTripShape(payload) {
  const departure = dateOnly(payload?.departureDate);
  if (!departure) throw new AppError('A departure date is required', 400);
  if (daysBetweenDateOnly(getDubaiDateString(), departure) < 0) {
    throw new AppError('The departure date cannot be in the past', 400);
  }

  if (payload?.type === 'Return') {
    const returnDate = dateOnly(payload?.returnDate);
    if (!returnDate) throw new AppError('A return date is required for a return trip', 400);
    if (daysBetweenDateOnly(departure, returnDate) < 0) {
      throw new AppError('The return date cannot be before the departure date', 400);
    }
  }

  const adults = nonNegativeInteger(payload?.quantity?.adults);
  const children = nonNegativeInteger(payload?.quantity?.children);
  const infants = nonNegativeInteger(payload?.quantity?.infants);
  if (adults < 1) throw new AppError('At least one adult is required', 400);

  const expected = adults + children + infants;
  if (expected > MAX_PASSENGERS) {
    throw new AppError(`A booking cannot hold more than ${MAX_PASSENGERS} passengers`, 400);
  }

  const passengers = Array.isArray(payload?.passengers) ? payload.passengers : [];
  if (passengers.length !== expected) {
    throw new AppError('The passenger details do not match the number of travellers selected', 400);
  }
  if (passengers.some((p) => !trimmedString(p?.firstName) || !trimmedString(p?.lastName))) {
    throw new AppError('Every passenger needs a first and last name', 400);
  }
}

function assertDeliveryAndValidity(payload) {
  const departure = dateOnly(payload?.departureDate);
  if (!departure) return;

  const delivery = payload?.ticketDelivery?.immediate
    ? ''
    : dateOnly(payload?.ticketDelivery?.deliveryDate);
  if (delivery && daysBetweenDateOnly(getDubaiDateString(), delivery) < 0) {
    throw new AppError('Delivery date cannot be in the past', 400);
  }
  if (delivery && daysBetweenDateOnly(delivery, departure) < 0) {
    throw new AppError('Delivery date cannot be after the departure date', 400);
  }

  const validity = payload?.ticketValidity;
  const needed = VALIDITY_DAYS[validity];
  if (!needed || validity === SHORTEST_VALIDITY) return;
  const daysToDeparture = daysBetweenDateOnly(getDubaiDateString(), departure);
  if (daysToDeparture === null) return;
  if (needed > daysToDeparture + 1) {
    throw new AppError(`A ${validity} reservation would outlast a departure ${daysToDeparture} day${daysToDeparture === 1 ? '' : 's'} away`, 400);
  }
}

function isDeliveryDayReached(ticket) {
  if (ticket?.ticketDelivery?.immediate) return true;
  const scheduled = ticket?.ticketDelivery?.deliveryDate?.slice(0, 10);
  if (!scheduled) return true;
  return getDubaiDateString() >= scheduled;
}

function applyDeliveryDateFilter(queryObj, deliveryDate) {
  if (!deliveryDate) return;
  const dateStr = deliveryDate === 'today' ? getDubaiDateString() : deliveryDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
  queryObj['ticketDelivery.deliveryDate'] = { $gte: dateStr, $lt: `${dateStr}~` };
  if (!queryObj.paymentStatus) queryObj.paymentStatus = 'PAID';
}

function buildTicketFilter(query = {}) {
  const queryObj = buildFieldFilters(query);
  applyDeliveryDateFilter(queryObj, query.deliveryDate);
  Object.assign(queryObj, attributionChannelFilter(query.channel));
  const paidOnly = queryObj.paymentStatus === 'PAID';
  const recency = buildRecencyFilter(query.createdAt, paidOnly);
  return {
    filter: {
      ...queryObj,
      ...buildSearchFilter(query.search),
      ...(recency ? { $and: [recency] } : {}),
    },
    paidOnly,
  };
}

const countWhen = (condition) => ({ $sum: { $cond: [condition, 1, 0] } });
const IS_PAID = { $eq: ['$paymentStatus', 'PAID'] };

export function createTicketService({ Ticket, Affiliate, pricingService, currencyService, stripe, paypal, notifications, frontendUrl, brevo, reviewListId, paidOrderBus, reservationStorage, sendEmail, metaCapi, openaiCapi }) {
  // getUnitPrice already prices in the requested currency, so nothing here converts a second time.
  const resolveTicketAmount = async ({ validity, passengers, targetCode }) => {
    const { currency: currencyCode, unitPrice } = await pricingService.getUnitPrice(
      validity,
      targetCode,
    );
    return {
      unitPrice: roundToCurrency(unitPrice, currencyCode),
      totalAmount: roundToCurrency(unitPrice * passengers, currencyCode),
      currencyCode,
    };
  };

  // Null when the order cannot be priced in a currency PayPal accepts, so callers never send it one it will reject.
  const resolvePayPalAmount = async ({ validity, passengers, preferredCode }) => {
    const quote = await resolveTicketAmount({
      validity,
      passengers,
      targetCode: payPalCurrencyFor(preferredCode),
    });
    if (payPalCurrencyFor(quote.currencyCode) !== quote.currencyCode) return null;
    return quote;
  };

  const getTicketQuote = async (sessionId, requestedCurrency) => {
    const ticket = await Ticket.findOne({ sessionId }).select('quantity ticketValidity currency');
    if (!ticket) throw new AppError('Ticket not found', 404);

    const passengers =
      Number(ticket.quantity?.adults || 0) + Number(ticket.quantity?.children || 0);
    if (passengers < 1) throw new AppError('At least 1 passenger is required for checkout', 400);

    const targetCode = pickCurrencyCode(requestedCurrency || ticket.currency);
    const { unitPrice, totalAmount, currencyCode } = await resolveTicketAmount({
      validity: ticket.ticketValidity,
      passengers,
      targetCode,
    });

    const payPalQuote = await resolvePayPalAmount({
      validity: ticket.ticketValidity,
      passengers,
      preferredCode: currencyCode,
    });

    return {
      currency: currencyCode,
      unitPrice,
      passengers,
      totalAmount,
      payPal: payPalQuote
        ? {
            currency: payPalQuote.currencyCode,
            unitPrice: payPalQuote.unitPrice,
            totalAmount: payPalQuote.totalAmount,
          }
        : null,
    };
  };

  // Totals come from the database, not from a page of rows, so they stay right past the page limit.
  const getTicketStats = async (query = {}) => {
    const { filter } = buildTicketFilter(query);

    const [[agg], baseCurrency] = await Promise.all([
      Ticket.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            paid: countWhen(IS_PAID),
            unpaid: countWhen({ $eq: ['$paymentStatus', 'UNPAID'] }),
            refunded: countWhen({ $eq: ['$paymentStatus', 'REFUNDED'] }),
            pending: countWhen({ $eq: ['$orderStatus', 'PENDING'] }),
            delivered: countWhen({ $eq: ['$orderStatus', 'DELIVERED'] }),
            progress: countWhen({ $eq: ['$orderStatus', 'PROGRESS'] }),
            revenue: {
              $sum: { $cond: [IS_PAID, { $ifNull: ['$amountPaidBase.amount', 0] }, 0] },
            },
            revenueUnconverted: countWhen({
              $and: [IS_PAID, { $eq: [{ $ifNull: ['$amountPaidBase.amount', null] }, null] }],
            }),
          },
        },
      ]),
      currencyService.getBaseCurrency(),
    ]);

    return {
      total: agg?.total ?? 0,
      paymentStatus: {
        PAID: agg?.paid ?? 0,
        UNPAID: agg?.unpaid ?? 0,
        REFUNDED: agg?.refunded ?? 0,
      },
      orderStatus: {
        PENDING: agg?.pending ?? 0,
        DELIVERED: agg?.delivered ?? 0,
        PROGRESS: agg?.progress ?? 0,
      },
      revenue: {
        currency: baseCurrency.code,
        amount: roundToCurrency(agg?.revenue ?? 0, baseCurrency.code),
        unconvertedOrders: agg?.revenueUnconverted ?? 0,
      },
    };
  };

  const getAllTickets = async (query) => {
    const { filter: finalQuery, paidOnly } = buildTicketFilter(query);

    let page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(query.limit, 10) || 100));
    const total = await Ticket.countDocuments(finalQuery);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    if (page > totalPages) page = totalPages;

    const data = await Ticket.find(finalQuery)
      .sort(paidOnly ? { paidAt: -1 } : { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('handledBy');

    return { data, pagination: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 } };
  };

  const getTicketBySessionId = (sessionId) =>
    Ticket.findOne({ sessionId })
      .populate('handledBy')
      .populate('affiliate', 'name email affiliateId commissionPercent isActive');

  const getLatestPaidTicket = () =>
    Ticket.findOne({ paymentStatus: 'PAID', paidAt: { $ne: null } })
      .sort({ paidAt: -1 })
      .select('sessionId paidAt')
      .lean();

  const sendReservation = async ({ sessionId, agentId, agentName, subject, body, bodyHtml, file }) => {
    if (!reservationStorage || !sendEmail) {
      throw new AppError('Reservation sending is not configured on this server', 500);
    }
    if (!file?.buffer) throw new AppError('Reservation PDF is required', 400);
    if (file.buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
      throw new AppError('The reservation file is not a valid PDF', 400);
    }
    if (!subject?.trim() || !body?.trim()) throw new AppError('Subject and body are required', 400);

    const ticket = await Ticket.findOne({ sessionId });
    if (!ticket) throw new AppError('Ticket not found', 404);
    if (!ticket.email) throw new AppError('Ticket has no customer email on file', 400);
    if (!isDeliveryDayReached(ticket)) {
      throw new AppError('This ticket is scheduled for a later delivery date. Bring the delivery date forward before sending.', 409);
    }

    const canStorePrivately = typeof reservationStorage.saveAuthenticatedFile === 'function';
    const stored = canStorePrivately
      ? await reservationStorage.saveAuthenticatedFile(file.buffer, `${sessionId}/reservation-file`, {
          resourceType: 'image',
        })
      : null;
    const url = canStorePrivately
      ? null
      : await reservationStorage.saveFile(file.buffer, `${sessionId}/reservation-file.pdf`, {
          resourceType: 'image',
        });

    const ok = await sendEmail({
      email: ticket.email,
      name: ticket.leadPassenger || '',
      subject: subject.trim(),
      textContent: body,
      htmlContent: bodyHtml || body.split('\n').map((l) => l || '&nbsp;').join('<br>'),
      attachment: [{
        name: 'reservation-file.pdf',
        content: file.buffer.toString('base64'),
      }],
    });
    if (!ok?.ok) throw new AppError('Could not send reservation email', 502);

    const updated = await Ticket.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          events: ticketEvent({
            actor: { id: agentId, name: agentName },
            action: 'RESERVATION_SENT',
            from: ticket.orderStatus,
            to: 'DELIVERED',
            detail: ticket.email,
          }),
        },
        $set: {
          orderStatus: 'DELIVERED',
          handledBy: agentId ? new mongoose.Types.ObjectId(agentId) : ticket.handledBy,
          reservationUrl: url,
          reservationFile: stored
            ? { publicId: stored.publicId, format: stored.format || 'pdf', resourceType: stored.resourceType || 'image' }
            : { publicId: null, format: null, resourceType: null },
          reservationSentAt: new Date(),
        },
      },
      { new: true },
    ).populate('handledBy');
    return updated;
  };

  const getReservationDownloadUrl = async (sessionId) => {
    const ticket = await Ticket.findOne({ sessionId }).select('reservationFile reservationUrl');
    if (!ticket) throw new AppError('Ticket not found', 404);

    const publicId = ticket.reservationFile?.publicId;
    if (publicId) {
      if (typeof reservationStorage?.signSecureUrl !== 'function') {
        throw new AppError('Secure file storage is not configured on this server', 500);
      }
      return reservationStorage.signSecureUrl(publicId, 300, {
        resourceType: ticket.reservationFile?.resourceType || 'image',
        format: ticket.reservationFile?.format || 'pdf',
      });
    }

    if (ticket.reservationUrl) return ticket.reservationUrl;
    throw new AppError('No reservation file has been sent for this ticket', 404);
  };

  const updateOrderStatus = async (sessionId, userId, orderStatus, actor = null) => {
    if (!orderStatus) throw new AppError('Order status is required', 400);
    const allowed = ['PENDING', 'DELIVERED', 'PROGRESS', 'REFUNDED'];
    if (!allowed.includes(orderStatus)) throw new AppError('Invalid order status', 400);
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Invalid user ID', 400);

    const existing = await Ticket.findOne({ sessionId }).select('orderStatus ticketDelivery');
    if (!existing) throw new AppError('Ticket not found', 404);

    if (orderStatus === 'PROGRESS' || orderStatus === 'DELIVERED') {
      if (!isDeliveryDayReached(existing)) {
        throw new AppError('This ticket is scheduled for a later delivery date. Bring the delivery date forward first.', 409);
      }
    }

    const changed = existing.orderStatus !== orderStatus;

    const updated = await Ticket.findOneAndUpdate(
      { sessionId },
      {
        $set: { orderStatus, handledBy: new mongoose.Types.ObjectId(userId) },
        ...(changed
          ? {
              $push: {
                events: ticketEvent({
                  actor: actor ?? { id: userId },
                  action: 'ORDER_STATUS_CHANGED',
                  from: existing.orderStatus,
                  to: orderStatus,
                }),
              },
            }
          : {}),
      },
      { new: true },
    ).populate('handledBy');

    if (!updated) throw new AppError('Ticket not found', 404);
    return updated;
  };

  const describeDelivery = (delivery) =>
    delivery?.immediate ? 'Immediate' : delivery?.deliveryDate || 'Not set';

  const updateDeliveryDate = async (sessionId, userId, { deliveryDate, immediate } = {}, actor = null) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Invalid user ID', 400);

    let ticketDelivery;
    if (immediate) {
      ticketDelivery = { immediate: true, deliveryDate: null };
    } else {
      const dateStr = typeof deliveryDate === 'string' ? deliveryDate.slice(0, 10) : '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        throw new AppError('A valid delivery date (YYYY-MM-DD) or immediate delivery is required', 400);
      }
      ticketDelivery = { immediate: false, deliveryDate: dateStr };
    }

    const existing = await Ticket.findOne({ sessionId }).select('ticketDelivery');
    if (!existing) throw new AppError('Ticket not found', 404);

    const updated = await Ticket.findOneAndUpdate(
      { sessionId },
      {
        $set: { ticketDelivery, handledBy: new mongoose.Types.ObjectId(userId) },
        $push: {
          events: ticketEvent({
            actor: actor ?? { id: userId },
            action: 'DELIVERY_CHANGED',
            from: describeDelivery(existing.ticketDelivery),
            to: describeDelivery(ticketDelivery),
          }),
        },
      },
      { new: true },
    ).populate('handledBy');

    if (!updated) throw new AppError('Ticket not found', 404);
    return updated;
  };

  const deleteTicket = async (sessionId) => {
    const existing = await Ticket.findOne({ sessionId }).select('paymentStatus');
    if (!existing) throw new AppError('Ticket not found', 404);
    if (existing.paymentStatus === 'PAID') {
      throw new AppError('A paid ticket cannot be deleted. Refund it first.', 409);
    }

    const deleted = await Ticket.findOneAndDelete({ sessionId, paymentStatus: { $ne: 'PAID' } });
    if (!deleted) throw new AppError('Ticket not found', 404);

    try {
      const publicId = deleted.reservationFile?.publicId;
      if (publicId && reservationStorage?.deleteAuthenticatedFile) {
        await reservationStorage.deleteAuthenticatedFile(publicId, {
          resourceType: deleted.reservationFile?.resourceType || 'image',
        });
      }
      if (deleted.reservationUrl && reservationStorage?.deleteSubfolder) {
        await reservationStorage.deleteSubfolder(sessionId);
      }
    } catch (err) {
      logger.warn('[tickets] Reservation asset cleanup failed', { sessionId, error: err.message });
    }
  };

  const createTicketRequest = async (payload) => {
    assertTripShape(payload);
    assertDeliveryAndValidity(payload);

    const input = pickTicketInput(payload);

    // Priced before the ticket exists so a validity that is off sale never becomes an unpayable order.
    const requestedCurrency = pickCurrencyCode(payload?.currency);
    const { currency: quotedCurrency } = await pricingService.getUnitPrice(
      input.ticketValidity,
      requestedCurrency,
    );

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
      ...input,
      email: normalizedEmail,
      currency: requestedCurrency || quotedCurrency,
      sessionId: uuidv4(),
      affiliateId: affiliateDoc ? affiliateDoc.affiliateId : null,
      affiliateCapturedAt,
      affiliate: affiliateDoc ? affiliateDoc._id : null,
      attribution: sanitizeAttribution(payload?.attribution),
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

    const requestedCode = pickCurrencyCode(formData?.currencyCode || ticket.currency);
    const { totalAmount, currencyCode } = await resolveTicketAmount({
      validity: ticket.ticketValidity,
      passengers: adults + children,
      targetCode: requestedCode,
    });

    const unitAmount = toStripeMinorUnits(totalAmount, currencyCode);
    if (!unitAmount || unitAmount <= 0) {
      throw new AppError('This reservation could not be priced for checkout', 400);
    }

    const metaAttribution = {
      fbp: typeof formData.fbp === 'string' ? formData.fbp.slice(0, 200) : undefined,
      fbc: typeof formData.fbc === 'string' ? formData.fbc.slice(0, 500) : undefined,
      clientIp: formData.clientIp,
      userAgent: typeof formData.userAgent === 'string' ? formData.userAgent.slice(0, 500) : undefined,
    };
    const openaiAttribution = {
      oppref: typeof formData.oppref === 'string' ? formData.oppref.slice(0, 500) : undefined,
      obref: typeof formData.obref === 'string' ? formData.obref.slice(0, 200) : undefined,
    };

    await Ticket.findOneAndUpdate({ sessionId }, { $set: { totalAmount, currency: currencyCode, metaAttribution, openaiAttribution } });

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
            currency: currencyCode.toLowerCase(),
            unit_amount: unitAmount,
            product_data: {
              name: `${ticket.type} flight reservation, ${ticket.ticketValidity} validity, ${adults + children} passenger${adults + children === 1 ? '' : 's'}, ${ticket.from} to ${ticket.to}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/booking/payment?sessionId=${sessionId}`,
      cancel_url: `${frontendUrl}/booking/review-details`,
    }, { idempotencyKey: `${sessionId}:${currencyCode}:${unitAmount}` });
  };

  const reportPurchaseToOpenAI = async (ticket) => {
    if (!openaiCapi?.isConfigured?.()) return;
    const lead = ticket.passengers?.[0];
    try {
      await openaiCapi.trackOrder({
        eventId: `dummy-ticket:${ticket.sessionId}`,
        eventTime: ticket.paidAt ?? new Date(),
        sourceUrl: `${frontendUrl}/booking/payment`,
        value: ticket.amountPaid?.amount,
        currency: ticket.amountPaid?.currency,
        user: {
          email: ticket.email,
          phone: ticket.phoneNumber?.code && ticket.phoneNumber?.digits
            ? `${ticket.phoneNumber.code}${ticket.phoneNumber.digits}`
            : undefined,
          firstName: lead?.firstName,
          lastName: lead?.lastName,
          externalId: ticket.email?.toLowerCase(),
          clientIp: ticket.metaAttribution?.clientIp,
          userAgent: ticket.metaAttribution?.userAgent,
          oppref: ticket.openaiAttribution?.oppref,
          obref: ticket.openaiAttribution?.obref,
        },
      });
    } catch (err) {
      logger.warn('[tickets] OpenAI order event failed', { sessionId: ticket.sessionId, error: err.message });
    }
  };

  const reportPurchaseToMeta = async (ticket) => {
    if (!metaCapi?.isConfigured?.()) return;
    const lead = ticket.passengers?.[0];
    const phone = ticket.phoneNumber?.code && ticket.phoneNumber?.digits
      ? `${ticket.phoneNumber.code}${ticket.phoneNumber.digits}`
      : undefined;
    try {
      await metaCapi.trackPurchase({
        eventId: `dummy-ticket:${ticket.sessionId}`,
        eventTime: ticket.paidAt ?? new Date(),
        eventSourceUrl: `${frontendUrl}/booking/payment`,
        value: ticket.amountPaid?.amount,
        currency: ticket.amountPaid?.currency,
        user: {
          email: ticket.email,
          phone,
          firstName: lead?.firstName,
          lastName: lead?.lastName,
          externalId: ticket.email?.toLowerCase(),
          clientIp: ticket.metaAttribution?.clientIp,
          userAgent: ticket.metaAttribution?.userAgent,
          fbp: ticket.metaAttribution?.fbp,
          fbc: ticket.metaAttribution?.fbc,
        },
      });
    } catch (err) {
      logger.warn('[tickets] Meta purchase event failed', { sessionId: ticket.sessionId, error: err.message });
    }
  };

  const ticketEvent = ({ actor, action, from = null, to = null, detail = null }) => ({
    at: new Date(),
    by: actor?.id && mongoose.Types.ObjectId.isValid(actor.id) ? new mongoose.Types.ObjectId(actor.id) : null,
    byName: actor?.name || null,
    action,
    from: from === null || from === undefined ? null : String(from),
    to: to === null || to === undefined ? null : String(to),
    detail,
  });

  const announcePaidTicket = async (ticket) => {
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

    await notifications.sendTicketPaymentToCustomer?.({
      email: ticket.email,
      leadPassenger: ticket.leadPassenger,
      passengers: ticket.passengers,
      type: ticket.type,
      from: ticket.from,
      to: ticket.to,
      departureDate: ticket.departureDate,
      ticketValidity: ticket.ticketValidity,
      ticketDelivery: ticket.ticketDelivery,
    });

    await reportPurchaseToMeta(ticket);
    await reportPurchaseToOpenAI(ticket);

    try {
      await brevo?.addContactToReviewList?.({
        email: ticket.email,
        firstName: ticket.passengers?.[0]?.firstName ?? undefined,
        listId: reviewListId,
      });
    } catch (err) {
      logger.warn('Brevo addContactToReviewList failed', { email: ticket.email, error: err });
    }
  };

  // Buyer notifications must not hold the Stripe webhook open: a slow mail provider would time it out and trigger a replay.
  const runDetached = (label, task) => {
    setImmediate(() => {
      Promise.resolve()
        .then(task)
        .catch((err) => logger.error(`[tickets] ${label} failed`, { error: err.message }));
    });
  };

  // Two checkouts for one email can both pass the first-purchase check, so the earliest paid order keeps the affiliate.
  const reconcileAffiliateExclusivity = async (ticket) => {
    if (!ticket?.affiliate || !ticket.email || !ticket.paidAt) return ticket;

    const earlierPaidAffiliateOrder = await Ticket.exists({
      _id: { $ne: ticket._id },
      email: normalizeEmail(ticket.email),
      paymentStatus: 'PAID',
      affiliate: { $ne: null },
      $or: [
        { paidAt: { $lt: ticket.paidAt } },
        { paidAt: ticket.paidAt, _id: { $lt: ticket._id } },
      ],
    });
    if (!earlierPaidAffiliateOrder) return ticket;

    logger.info('[tickets] Affiliate cleared: an earlier paid order already used this email', {
      sessionId: ticket.sessionId,
    });

    return Ticket.findOneAndUpdate(
      { _id: ticket._id },
      {
        $set: {
          affiliate: null,
          affiliateId: null,
          affiliateCapturedAt: null,
          affiliateCommissionPercent: null,
          affiliateCommission: { currency: null, amount: null },
        },
      },
      { new: true },
    );
  };

  const buildPaymentSnapshot = async ({ existing, currency, amount, clearAffiliate }) => {
    const snapshot = {};

    if (existing.amountPaidBase?.amount == null) {
      const base = await currencyService.convertToBase({ amount, sourceCode: currency });
      if (base) {
        snapshot.amountPaidBase = {
          currency: base.currencyCode,
          amount: base.amount,
          rate: base.rate,
        };
      } else {
        logger.error('[tickets] Could not convert a payment to the base currency', {
          sessionId: existing.sessionId,
          currency,
          amount,
        });
      }
    }

    if (clearAffiliate) {
      snapshot.affiliateCommissionPercent = null;
      snapshot.affiliateCommission = { currency: null, amount: null };
      return snapshot;
    }

    if (!existing.affiliate || existing.affiliateCommission?.amount != null) return snapshot;

    const affiliate = await Affiliate.findById(existing.affiliate).select('commissionPercent').lean();
    const percent = Number(affiliate?.commissionPercent);
    if (!Number.isFinite(percent)) return snapshot;

    const baseCurrency = snapshot.amountPaidBase?.currency ?? existing.amountPaidBase?.currency;
    const baseAmount = snapshot.amountPaidBase?.amount ?? existing.amountPaidBase?.amount;
    if (baseAmount == null || !baseCurrency) return snapshot;

    snapshot.affiliateCommissionPercent = percent;
    snapshot.affiliateCommission = {
      currency: baseCurrency,
      amount: Number(((baseAmount * percent) / 100).toFixed(2)),
    };
    return snapshot;
  };

  const handleStripeSuccess = async (session) => {
    if (session.payment_status !== 'paid') return;

    const sessionId = session.metadata.sessionId;
    const currency =
      normalizeCurrencyCode(session.currency) || (await currencyService.getBaseCurrency()).code;
    const amount = fromStripeMinorUnits(session.amount_total, currency);
    const transactionId = session.id;

    if (amount === null) {
      throw new Error(`[tickets] Stripe session ${session.id} carried no usable amount_total`);
    }

    const existing = await Ticket.findOne({ sessionId });
    if (!existing) {
      throw new Error(`[tickets] Ticket not found for sessionId: ${sessionId}`);
    }

    if (existing.paymentStatus === 'PAID') {
      logger.info('[tickets] Stripe success replayed for an already paid ticket, skipping', { sessionId });
      return;
    }

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

    const paymentSnapshot = await buildPaymentSnapshot({
      existing,
      currency,
      amount,
      clearAffiliate: shouldClearAffiliate,
    });

    // Idempotency: this update claims the unpaid-to-paid transition, so a replay sends no second email.
    const ticket = await Ticket.findOneAndUpdate(
      { sessionId, paymentStatus: { $ne: 'PAID' } },
      {
        $set: {
          paymentStatus: 'PAID',
          paidAt: existing.paidAt ?? new Date(),
          amountPaid: { currency, amount },
          transactionId,
          orderStatus: 'PENDING',
          ...paymentSnapshot,
          ...(shouldClearAffiliate ? { affiliate: null, affiliateId: null, affiliateCapturedAt: null } : {}),
        },
      },
      { new: true },
    );

    if (!ticket) {
      logger.info('[tickets] Stripe success already applied by another delivery, skipping', { sessionId });
      return;
    }

    await reconcileAffiliateExclusivity(ticket);

    paidOrderBus?.publish({ sessionId: ticket.sessionId, paidAt: ticket.paidAt });

    runDetached('paid-order follow-up', () => announcePaidTicket(ticket));
  };

  const createPayPalOrder = async (formData) => {
    if (!paypal) throw new AppError('PayPal is not configured', 503);

    const { sessionId } = formData;
    if (!sessionId) throw new AppError('Session ID is required', 400);

    const ticket = await Ticket.findOne({ sessionId });
    if (!ticket) throw new AppError('Ticket not found', 404);

    const adults = Number(ticket.quantity?.adults || 0);
    const children = Number(ticket.quantity?.children || 0);
    if (adults + children < 1) throw new AppError('At least 1 passenger is required for checkout', 400);

    const payPalQuote = await resolvePayPalAmount({
      validity: ticket.ticketValidity,
      passengers: adults + children,
      preferredCode: pickCurrencyCode(formData?.currencyCode || ticket.currency),
    });
    if (!payPalQuote) {
      throw new AppError('PayPal cannot take this payment. Please pay by card instead.', 409);
    }
    const { totalAmount, currencyCode } = payPalQuote;

    const metaAttribution = {
      fbp: typeof formData.fbp === 'string' ? formData.fbp.slice(0, 200) : undefined,
      fbc: typeof formData.fbc === 'string' ? formData.fbc.slice(0, 500) : undefined,
      clientIp: formData.clientIp,
      userAgent: typeof formData.userAgent === 'string' ? formData.userAgent.slice(0, 500) : undefined,
    };
    const openaiAttribution = {
      oppref: typeof formData.oppref === 'string' ? formData.oppref.slice(0, 500) : undefined,
      obref: typeof formData.obref === 'string' ? formData.obref.slice(0, 200) : undefined,
    };

    await Ticket.findOneAndUpdate({ sessionId }, { $set: { totalAmount, currency: currencyCode, metaAttribution, openaiAttribution } });

    return paypal.createOrder({
      amount: totalAmount,
      currency: currencyCode,
      sessionId,
      requestId: `${sessionId}:${currencyCode}:${totalAmount}`,
      description: `${ticket.type} Flight Reservation`,
      returnUrl: `${frontendUrl}/booking/payment?sessionId=${sessionId}&paymentMethod=paypal`,
      cancelUrl: `${frontendUrl}/booking/review-details`,
    });
  };

  const capturePayPalOrder = async ({ sessionId, orderId }) => {
    if (!paypal) throw new AppError('PayPal is not configured', 503);
    if (!sessionId) throw new AppError('Session ID is required', 400);
    if (!orderId) throw new AppError('PayPal order ID is required', 400);

    const existing = await Ticket.findOne({ sessionId });
    if (!existing) throw new AppError('Ticket not found', 404);

    if (existing.paymentStatus === 'PAID') return existing;

    const captureData = await paypal.captureOrder(orderId);

    if (captureData.status !== 'COMPLETED') {
      throw new AppError(`PayPal payment not completed (status: ${captureData.status})`, 400);
    }

    const captureUnit = captureData.purchase_units?.[0];
    const capture = captureUnit?.payments?.captures?.[0];
    const currency =
      normalizeCurrencyCode(capture?.amount?.currency_code) ||
      normalizeCurrencyCode(existing.currency) ||
      (await currencyService.getBaseCurrency()).code;
    const amount = roundToCurrency(
      capture?.amount?.value ?? existing.totalAmount ?? 0,
      currency,
    );
    const transactionId = captureData.id;

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

    const paymentSnapshot = await buildPaymentSnapshot({
      existing,
      currency,
      amount,
      clearAffiliate: shouldClearAffiliate,
    });

    // Idempotency: this update claims the unpaid-to-paid transition, so a retry sends no second email.
    const ticket = await Ticket.findOneAndUpdate(
      { sessionId, paymentStatus: { $ne: 'PAID' } },
      {
        $set: {
          paymentStatus: 'PAID',
          paidAt: existing.paidAt ?? new Date(),
          paymentMethod: 'paypal',
          amountPaid: { currency, amount },
          transactionId,
          orderStatus: 'PENDING',
          ...paymentSnapshot,
          ...(shouldClearAffiliate ? { affiliate: null, affiliateId: null, affiliateCapturedAt: null } : {}),
        },
      },
      { new: true },
    );

    if (!ticket) return Ticket.findOne({ sessionId }).populate('handledBy');

    const reconciled = await reconcileAffiliateExclusivity(ticket);

    paidOrderBus?.publish({ sessionId: ticket.sessionId, paidAt: ticket.paidAt });

    runDetached('paid-order follow-up', () => announcePaidTicket(ticket));

    return reconciled ?? ticket;
  };

  const refundByTransactionId = async (transactionId, actor = null) => {
    const ticket = await Ticket.findOne({ transactionId });
    if (!ticket) throw new AppError('Ticket not found', 404);
    if (ticket.paymentStatus !== 'PAID') throw new AppError('Payment not completed', 400);
    if (ticket.paymentMethod === 'paypal') {
      throw new AppError('This order was paid with PayPal. Refund it from the PayPal dashboard, then mark it refunded here.', 400);
    }

    const session = await stripe.checkout.sessions.retrieve(ticket.transactionId);
    if (!session.payment_intent) throw new AppError('PaymentIntent not found', 400);

    const refund = await stripe.refunds.create({ payment_intent: session.payment_intent });

    await Ticket.findOneAndUpdate(
      { transactionId },
      {
        $set: { paymentStatus: 'REFUNDED', orderStatus: 'REFUNDED', refundedAt: new Date() },
        $push: {
          events: ticketEvent({
            actor,
            action: 'REFUNDED',
            from: ticket.orderStatus,
            to: 'REFUNDED',
            detail: ticket.amountPaid?.amount
              ? `${ticket.amountPaid.currency} ${ticket.amountPaid.amount}`
              : null,
          }),
        },
      },
      { new: true },
    );

    return refund;
  };

  return { getAllTickets, getTicketStats, getLatestPaidTicket, getTicketBySessionId, getTicketQuote, getReservationDownloadUrl, updateOrderStatus, updateDeliveryDate, deleteTicket, sendReservation, createTicketRequest, createStripePaymentUrl, handleStripeSuccess, createPayPalOrder, capturePayPalOrder, refundByTransactionId };
}
