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
      { 'supplier.bookingId': regex },
      { 'supplier.hotelConfirmationCode': regex },
      { sessionId: regex },
    ],
  };
}

export function createHotelBookingService({
  HotelBooking,
  Affiliate,
  supplier,
  citySuggest,
  pricingService,
  stripe,
  notifications,
  frontendUrl,
  paidOrderBus,
  minFreeCancellationMarginMs = 48 * 60 * 60 * 1000,
  maxReplacementPriceMultiplier = 1.25,
  maxReplacementAttempts = 5,
  maxOffersReturned = 30,
}) {
  const searchOffers = async ({ cityName, countryCode, hotelIds, checkIn, checkOut, occupancy, guestNationality, currency }) => {
    const { checkIn: from, checkOut: to } = assertStayDates({ checkIn, checkOut });
    let offers;
    try {
      offers = await supplier.refundableOffers(
        {
          ...(hotelIds ? { hotelIds } : { cityName, countryCode }),
          checkin: from,
          checkout: to,
          occupancies: [{
            rooms: Number(occupancy?.rooms || 1),
            adults: Number(occupancy?.adults || 1),
            ...(occupancy?.children?.length ? { children: occupancy.children } : {}),
          }],
          currency: String(currency || 'USD').toUpperCase(),
          guestNationality: String(guestNationality || 'AE').toUpperCase(),
        },
        { marginMs: minFreeCancellationMarginMs },
      );
    } catch (err) {
      if (err.code === 2001) throw new AppError('No refundable rooms available for those dates', 404);
      throw err;
    }
    if (offers.length === 0) throw new AppError('No refundable rooms available for those dates', 404);

    const cheapestPerHotel = new Map();
    for (const offer of offers) {
      const current = cheapestPerHotel.get(offer.hotelId);
      if (!current || Number(offer.price?.amount ?? Infinity) < Number(current.price?.amount ?? Infinity)) {
        cheapestPerHotel.set(offer.hotelId, offer);
      }
    }

    return [...cheapestPerHotel.values()]
      .sort((a, b) => Number(a.price?.amount ?? 0) - Number(b.price?.amount ?? 0))
      .slice(0, maxOffersReturned);
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

  const listCountries = async () => {
    const countries = await supplier.getCountries();
    return countries
      .filter((c) => c.code && c.name)
      .map((c) => ({ id: c.code, code: c.code, nationality: c.name }))
      .sort((a, b) => a.nationality.localeCompare(b.nationality));
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
      guestNationality: payload?.guestNationality,
      destination: payload?.destination,
      checkIn,
      checkOut,
      nights,
      supplier: {
        offerId: payload?.offerId,
        hotelId: payload?.hotelId,
        quotedPrice: payload?.offerPrice ?? null,
      },
      hotel: payload?.hotel,
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
      success_url: `${frontendUrl}/hotel-booking/${sessionId}?status=success`,
      cancel_url: `${frontendUrl}/hotel-booking/${sessionId}?status=cancelled`,
    });
  };

  const isAcceptable = (prebook) =>
    supplier.isCancellationAcceptable(supplier.prebookCancellation(prebook), {
      marginMs: minFreeCancellationMarginMs,
    });

  const acquirePrebook = async (reservation) => {
    try {
      const prebook = await supplier.prebook({ offerId: reservation.supplier.offerId });
      if (prebook?.prebookId && isAcceptable(prebook)) {
        return { prebook, offerId: reservation.supplier.offerId, replaced: false };
      }
    } catch (err) {
      logger?.warn('[hotel-bookings] stored offer no longer prebooks, re-searching', {
        sessionId: reservation.sessionId,
        message: err.message,
      });
    }

    const hotelId = reservation.supplier?.hotelId;
    if (!hotelId) throw new AppError('Offer expired and no hotel is recorded to re-search', 409);

    const offers = await supplier.refundableOffers(
      {
        hotelIds: [hotelId],
        checkin: reservation.checkIn,
        checkout: reservation.checkOut,
        occupancies: [{
          rooms: Number(reservation.occupancy?.rooms || 1),
          adults: Number(reservation.occupancy?.adults || 1),
          ...(reservation.occupancy?.children?.length ? { children: reservation.occupancy.children } : {}),
        }],
        currency: reservation.supplier?.quotedPrice?.currency ?? 'USD',
        guestNationality: reservation.guestNationality ?? 'AE',
      },
      { marginMs: minFreeCancellationMarginMs },
    );

    const quoted = Number(reservation.supplier?.quotedPrice?.amount);
    const ceiling = Number.isFinite(quoted) ? quoted * maxReplacementPriceMultiplier : Infinity;

    const candidates = offers
      .filter((offer) => Number(offer.price?.amount ?? Infinity) <= ceiling)
      .sort((a, b) => Number(a.price?.amount ?? 0) - Number(b.price?.amount ?? 0))
      .slice(0, maxReplacementAttempts);

    for (const offer of candidates) {
      try {
        const prebook = await supplier.prebook({ offerId: offer.offerId });
        if (prebook?.prebookId && isAcceptable(prebook)) {
          logger?.warn('[hotel-bookings] booked a replacement offer', {
            sessionId: reservation.sessionId,
            hotelId,
            price: offer.price?.amount,
          });
          return { prebook, offerId: offer.offerId, replaced: true };
        }
      } catch {
      }
    }

    throw new AppError('No refundable room could be held for this stay; not booking', 409);
  };

  const sendConfirmationOnce = async (reservation) => {
    if (!reservation?.supplier?.bookingId) return;
    const claimed = await HotelBooking.findOneAndUpdate(
      { sessionId: reservation.sessionId, confirmationEmailSentAt: null },
      { $set: { confirmationEmailSentAt: new Date() } },
    );
    if (!claimed) return;

    try {
      await notifications.sendHotelBookingToCustomer?.({
        sessionId: reservation.sessionId,
        email: reservation.email,
        leadGuest: reservation.leadGuest,
        guests: reservation.guests,
        hotel: reservation.hotel,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        nights: reservation.nights,
        occupancy: reservation.occupancy,
        hotelConfirmationCode: reservation.supplier.hotelConfirmationCode,
        bookingReference: reservation.supplier.bookingId,
        freeCancellationUntil: reservation.freeCancellationUntil,
      });
      await HotelBooking.updateOne(
        { sessionId: reservation.sessionId },
        { $set: { orderStatus: 'DELIVERED', documentSentAt: new Date() } },
      );
    } catch (err) {
      await HotelBooking.updateOne(
        { sessionId: reservation.sessionId },
        { $set: { confirmationEmailSentAt: null } },
      );
      logger?.error('[hotel-bookings] confirmation email failed', {
        sessionId: reservation.sessionId,
        message: err.message,
      });
    }
  };

  const bookWithSupplier = async (sessionId) => {
    const claimed = await HotelBooking.findOneAndUpdate(
      { sessionId, paymentStatus: 'PAID', 'supplier.bookClaimedAt': null },
      { $set: { 'supplier.bookClaimedAt': new Date() } },
      { new: true },
    );
    if (!claimed) return null;

    try {
      const { prebook, offerId, replaced } = await acquirePrebook(claimed);

      const lead = claimed.guests?.find((g) => g.isLead) ?? claimed.guests?.[0] ?? {};
      const booking = await supplier.book({
        prebookId: prebook.prebookId,
        holder: { firstName: lead.firstName, lastName: lead.lastName, email: claimed.email },
        guests: claimed.guests.map((g, i) => ({
          occupancyNumber: i + 1,
          firstName: g.firstName,
          lastName: g.lastName,
          email: claimed.email,
        })),
        clientReference: claimed.sessionId,
      });

      const deadline = supplier.bookingFreeCancellationUntil(booking);
      if (!deadline) throw new Error('Confirmed booking carries no free-cancellation deadline');

      const booked = await HotelBooking.findOneAndUpdate(
        { sessionId },
        {
          $set: {
            orderStatus: 'BOOKED',
            cancellationStatus: 'SCHEDULED',
            freeCancellationUntil: deadline,
            'supplier.offerId': offerId,
            'supplier.offerReplaced': replaced,
            'supplier.prebookId': prebook.prebookId,
            'supplier.bookingId': booking?.bookingId,
            'supplier.supplierBookingId': booking?.supplierBookingId,
            'supplier.hotelConfirmationCode': booking?.hotelConfirmationCode,
            'supplier.price': { amount: prebook?.price, currency: prebook?.currency },
            'supplier.bookedAt': new Date(),
            'supplier.lastError': null,
            ...(booking?.hotel ? { hotel: booking.hotel } : {}),
          },
        },
        { new: true },
      );

      await sendConfirmationOnce(booked);
      return booked;
    } catch (err) {
      logger?.error('[hotel-bookings] supplier booking failed', { sessionId, message: err.message });
      await HotelBooking.updateOne(
        { sessionId },
        { $set: { orderStatus: 'BOOKING_FAILED', 'supplier.bookClaimedAt': null, 'supplier.lastError': err.message } },
      );
      await notifications.sendHotelBookingFailureToAdmin?.({ sessionId, email: (await HotelBooking.findOne({ sessionId }))?.email, reason: err.message });
      throw err;
    }
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
    });

    return bookWithSupplier(sessionId);
  };

  const cancelReservation = async (sessionId, { force = false } = {}) => {
    const reservation = await HotelBooking.findOne({ sessionId });
    if (!reservation) throw new AppError('Reservation not found', 404);
    if (reservation.cancellationStatus === 'CANCELLED') return reservation;
    if (!reservation.supplier?.bookingId) throw new AppError('Reservation has no supplier booking to cancel', 409);

    const deadline = reservation.freeCancellationUntil;
    if (!force && deadline && Date.now() >= deadline.getTime()) {
      throw new AppError('Free-cancellation window has closed; cancel manually with force to accept the fee', 409);
    }

    const result = await supplier.cancelBooking(reservation.supplier.bookingId);
    const cancelled = result.status === 'CANCELLED';

    if (!cancelled) {
      logger?.error('[hotel-bookings] cancellation did not come back clean', {
        sessionId, status: result.status, fee: result.cancellationFee,
      });
    }

    return HotelBooking.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          cancellationStatus: cancelled ? 'CANCELLED' : 'FAILED',
          cancelledAt: new Date(),
          cancellationFee: { amount: result.cancellationFee, currency: result.currency },
        },
        $inc: { cancellationAttempts: 1 },
      },
      { new: true },
    );
  };

  const listDueForCancellation = ({ before = new Date(), limit = 100 } = {}) =>
    HotelBooking.find({
      cancellationStatus: { $in: ['SCHEDULED', 'FAILED'] },
      'supplier.bookingId': { $ne: null },
      freeCancellationUntil: { $ne: null, $lte: before },
    })
      .sort({ freeCancellationUntil: 1 })
      .limit(limit);

  const getAllReservations = async (query = {}) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Number(query.limit) || 25);
    const filter = {};
    if (query.orderStatus) filter.orderStatus = query.orderStatus;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.cancellationStatus) filter.cancellationStatus = query.cancellationStatus;
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
    searchOffers,
    suggestCities,
    listCountries,
    createReservationRequest,
    createStripePaymentUrl,
    handleStripeSuccess,
    bookWithSupplier,
    cancelReservation,
    listDueForCancellation,
    getAllReservations,
    getReservationBySessionId,
    getLatestPaidReservation,
    updateOrderStatus,
    deleteReservation,
  };
}
