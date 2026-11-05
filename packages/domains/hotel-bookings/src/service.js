import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { AppError, logger, sanitizeAttribution } from '@travel-suite/utils';
import { fromStripeMinorUnits, toStripeMinorUnits } from '@travel-suite/utils/currency';

const RECENCY_HOURS = { '4_hours': 4, '24_hours': 24, '7_days': 168 };

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : email;
}

function dateOnly(value) {
  const str = String(value ?? '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(str) ? str : null;
}

function nightsBetween(checkIn, checkOut) {
  const from = Date.parse(`${checkIn}T00:00:00Z`);
  const to = Date.parse(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.round((to - from) / 86_400_000);
}

function assertStayDates(payload) {
  const checkIn = dateOnly(payload?.checkIn);
  const checkOut = dateOnly(payload?.checkOut);
  if (!checkIn || !checkOut) throw new AppError('Check-in and check-out dates are required as YYYY-MM-DD', 400);
  const nights = nightsBetween(checkIn, checkOut);
  if (!nights || nights < 1) throw new AppError('Check-out must be at least one night after check-in', 400);
  const today = new Date().toISOString().slice(0, 10);
  if (checkIn < today) throw new AppError('Check-in cannot be in the past', 400);
  return { checkIn, checkOut, nights };
}

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSearchFilter(search) {
  if (!search) return null;
  const regex = new RegExp(escapeRegex(search), 'i');
  return {
    $or: [
      { email: regex },
      { 'guests.firstName': regex },
      { 'guests.lastName': regex },
      { 'hotel.name': regex },
      { 'hotel.city': regex },
      { 'destination.cityName': regex },
      { sessionId: regex },
    ],
  };
}

export function createHotelBookingService({
  HotelBooking,
  Affiliate,
  hotelSearch,
  citySuggest,
  pricingService,
  stripe,
  notifications,
  frontendUrl,
  paidOrderBus,
  reservationStorage,
  sendEmail,
  maxHotelsReturned = 20,
}) {
  const searchHotels = async ({ cityName, countryCode, checkIn, checkOut, occupancy, currency }) => {
    const { checkIn: from, checkOut: to } = assertStayDates({ checkIn, checkOut });
    if (!cityName) throw new AppError('A city is required to search hotels', 400);

    const hotels = await hotelSearch({
      query: countryCode ? `${cityName}, ${countryCode}` : cityName,
      checkIn: from,
      checkOut: to,
      adults: Number(occupancy?.adults || 2),
      children: occupancy?.children?.length ?? 0,
      currency: String(currency || 'USD').toUpperCase(),
      countryCode,
    });

    if (hotels.length === 0) throw new AppError('No hotels found for those dates', 404);
    return hotels.slice(0, maxHotelsReturned);
  };

  const suggestCities = async (search) => {
    const query = String(search ?? '').trim();
    if (query.length < 2) return [];
    if (!citySuggest) throw new AppError('City search is not configured', 503);
    const cities = await citySuggest(query);
    return cities
      .filter((c) => c.name && c.countryCode)
      .map((c) => ({
        name: c.name,
        countryCode: c.countryCode,
        cityCode: c.cityCode ?? null,
        label: `${c.name}, ${c.countryCode}`,
      }));
  };

  const createReservationRequest = async (payload) => {
    const { checkIn, checkOut, nights } = assertStayDates(payload);
    const email = normalizeEmail(payload?.email);
    if (!email) throw new AppError('Email is required', 400);

    const isValidAffiliateId = /^\d{9}$/.test(payload?.affiliateId || '');
    const affiliateDoc = isValidAffiliateId
      ? await Affiliate?.findOne({ affiliateId: payload.affiliateId, isActive: true }).select('_id affiliateId')
      : null;

    const currency = String(payload?.currency || 'AED').toUpperCase();
    const { totalAmount, currencyCode } = await pricingService.resolvePrice({ nights, targetCode: currency });

    return HotelBooking.create({
      sessionId: uuidv4(),
      email,
      phoneNumber: payload?.phoneNumber,
      guests: payload?.guests ?? [],
      occupancy: payload?.occupancy,
      destination: payload?.destination,
      checkIn,
      checkOut,
      nights,
      hotel: payload?.hotel,
      message: payload?.message,
      totalAmount,
      currency: currencyCode,
      affiliateId: affiliateDoc ? affiliateDoc.affiliateId : null,
      affiliateCapturedAt: affiliateDoc ? new Date(payload?.affiliateCapturedAt ?? Date.now()) : null,
      affiliate: affiliateDoc ? affiliateDoc._id : null,
      attribution: sanitizeAttribution(payload?.attribution),
    });
  };

  const createStripePaymentUrl = async (formData) => {
    const { sessionId } = formData;
    if (!sessionId) throw new AppError('Session ID is required', 400);

    const reservation = await HotelBooking.findOne({ sessionId });
    if (!reservation) throw new AppError('Reservation not found', 404);
    if (reservation.paymentStatus === 'PAID') throw new AppError('Reservation is already paid', 409);

    const { totalAmount, currencyCode } = await pricingService.resolvePrice({
      nights: reservation.nights,
      targetCode: String(formData?.currencyCode || reservation.currency || '').toUpperCase(),
    });

    await HotelBooking.updateOne(
      { sessionId },
      { $set: { totalAmount, currency: currencyCode, metaAttribution: {
        fbp: typeof formData.fbp === 'string' ? formData.fbp.slice(0, 200) : undefined,
        fbc: typeof formData.fbc === 'string' ? formData.fbc.slice(0, 500) : undefined,
        clientIp: formData.clientIp,
        userAgent: typeof formData.userAgent === 'string' ? formData.userAgent.slice(0, 500) : undefined,
      } } },
    );

    return stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: reservation.email,
      invoice_creation: { enabled: true },
      metadata: { productType: 'hotel-booking', entity: 'HOTEL_BOOKING', sessionId },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: currencyCode.toLowerCase(),
          unit_amount: toStripeMinorUnits(totalAmount, currencyCode),
          product_data: {
            name: 'Hotel reservation',
            description: `${reservation.hotel?.name ?? reservation.destination?.cityName ?? 'Hotel'} · ${reservation.checkIn} to ${reservation.checkOut}`,
          },
        },
      }],
      success_url: `${frontendUrl}/hotel-booking/payment?sessionId=${sessionId}`,
      cancel_url: `${frontendUrl}/hotel-booking/review-details`,
    });
  };

  const handleStripeSuccess = async (session) => {
    if (session.payment_status !== 'paid') return null;

    const sessionId = session.metadata?.sessionId;
    const existing = await HotelBooking.findOne({ sessionId });
    if (!existing) throw new Error(`[hotel-bookings] Reservation not found for sessionId: ${sessionId}`);

    const paidCurrency = (session.currency || existing.currency || 'aed').toUpperCase();

    await HotelBooking.updateOne({ sessionId, paidAt: null }, { $set: { paidAt: new Date() } });

    const reservation = await HotelBooking.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          paymentStatus: 'PAID',
          amountPaid: { currency: paidCurrency, amount: fromStripeMinorUnits(session.amount_total, paidCurrency) },
          transactionId: session.id,
        },
      },
      { new: true },
    );

    paidOrderBus?.publish({ sessionId: reservation.sessionId, paidAt: reservation.paidAt });

    await notifications.sendHotelBookingPaymentToAdmin?.({
      sessionId: reservation.sessionId,
      email: reservation.email,
      leadGuest: reservation.leadGuest,
      hotel: reservation.hotel,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      nights: reservation.nights,
      occupancy: reservation.occupancy,
      guests: reservation.guests,
      message: reservation.message,
      phoneNumber: reservation.phoneNumber,
      amountPaid: reservation.amountPaid,
      destination: reservation.destination,
    });

    return reservation;
  };

  const sendReservation = async ({ sessionId, agentId, subject, body, bodyHtml, file }) => {
    if (!reservationStorage || !sendEmail) {
      throw new AppError('Reservation sending is not configured on this server', 500);
    }
    if (!file?.buffer) throw new AppError('Reservation PDF is required', 400);
    if (file.buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
      throw new AppError('The reservation file is not a valid PDF', 400);
    }
    if (!subject?.trim() || !body?.trim()) throw new AppError('Subject and body are required', 400);

    const reservation = await HotelBooking.findOne({ sessionId });
    if (!reservation) throw new AppError('Booking not found', 404);
    if (!reservation.email) throw new AppError('Booking has no customer email on file', 400);

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
      email: reservation.email,
      name: reservation.leadGuest || '',
      subject: subject.trim(),
      textContent: body,
      htmlContent: bodyHtml || body.split('\n').map((l) => l || '&nbsp;').join('<br>'),
      attachment: [{
        name: 'hotel-reservation.pdf',
        content: file.buffer.toString('base64'),
      }],
    });
    if (!ok?.ok) throw new AppError('Could not send reservation email', 502);

    return HotelBooking.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          orderStatus: 'DELIVERED',
          handledBy: agentId ? new mongoose.Types.ObjectId(agentId) : reservation.handledBy,
          documentUrl: url,
          reservationFile: stored
            ? { publicId: stored.publicId, format: stored.format || 'pdf', resourceType: stored.resourceType || 'image' }
            : { publicId: null, format: null, resourceType: null },
          documentSentAt: new Date(),
        },
      },
      { new: true },
    ).populate('handledBy');
  };

  const getAllReservations = async (query = {}) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Number(query.limit) || 25);
    const filter = {};
    if (query.orderStatus) filter.orderStatus = query.orderStatus;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    const hours = RECENCY_HOURS[query.createdAt];
    if (hours) filter.createdAt = { $gte: new Date(Date.now() - hours * 3_600_000) };
    const search = buildSearchFilter(typeof query.search === 'string' ? query.search.trim() : '');
    const finalFilter = search ? { $and: [filter, search] } : filter;

    const [data, total] = await Promise.all([
      HotelBooking.find(finalFilter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      HotelBooking.countDocuments(finalFilter),
    ]);
    return { data, total, page, limit };
  };

  const getReservationBySessionId = (sessionId) => HotelBooking.findOne({ sessionId });

  const getLatestPaidReservation = () =>
    HotelBooking.findOne({ paymentStatus: 'PAID' }).sort({ paidAt: -1 }).select('sessionId paidAt');

  const updateOrderStatus = async (sessionId, userId, orderStatus) => {
    const updated = await HotelBooking.findOneAndUpdate(
      { sessionId },
      { $set: { orderStatus, handledBy: userId ?? null } },
      { new: true, runValidators: true },
    );
    if (!updated) throw new AppError('Reservation not found', 404);
    return updated;
  };

  const deleteReservation = async (sessionId) => {
    const deleted = await HotelBooking.findOneAndDelete({ sessionId });
    if (!deleted) throw new AppError('Reservation not found', 404);
    return deleted;
  };

  return {
    searchHotels,
    suggestCities,
    sendReservation,
    createReservationRequest,
    createStripePaymentUrl,
    handleStripeSuccess,
    getAllReservations,
    getReservationBySessionId,
    getLatestPaidReservation,
    updateOrderStatus,
    deleteReservation,
  };
}
