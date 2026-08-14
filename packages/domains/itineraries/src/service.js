import { AppError, logger } from '@travel-suite/utils';
import { validateItinerary, computeMainDestination, computeReturnHome } from './validation.js';
import { isValidDateString, inclusiveDayCount } from './dates.js';

const norm = (s) => String(s ?? '').trim().toLowerCase();

function requireField(value, label) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new AppError(`${label} is required`, 400);
  }
}

function normalizePlace(place, label) {
  requireField(place?.city, `${label} city`);
  requireField(place?.country, `${label} country`);
  return { city: String(place.city).trim(), country: String(place.country).trim() };
}

function validateDateRange(startDate, endDate) {
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    throw new AppError('Dates must be valid calendar dates in YYYY-MM-DD format', 400);
  }
  if (endDate < startDate) {
    throw new AppError('End date cannot be before start date', 400);
  }
  if (inclusiveDayCount(startDate, endDate) > 60) {
    throw new AppError('Trips longer than 60 days are not supported', 400);
  }
}

function normalizeSegments(payload) {
  const raw = Array.isArray(payload?.segments) ? payload.segments : [];
  if (raw.length === 0) throw new AppError('Add at least one travel segment', 400);
  return raw
    .map((s, i) => {
      const from = normalizePlace(s?.from, `Segment ${i + 1} origin`);
      const to = normalizePlace(s?.to, `Segment ${i + 1} destination`);
      const date = String(s?.date ?? '').trim();
      if (!isValidDateString(date)) throw new AppError(`Segment ${i + 1} needs a valid date`, 400);
      return { from, to, date };
    })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function deriveTripFromSegments(segments, fromCountry) {
  const first = segments[0];
  const last = segments[segments.length - 1];
  const startDate = first.date;
  const endDate = last.date;
  validateDateRange(startDate, endDate);

  const returnsHome = norm(last.to.country) === norm(fromCountry);
  const stayCities = (returnsHome ? segments.slice(0, -1) : segments).map((s) => s.to);
  if (stayCities.length === 0) {
    throw new AppError('Add at least one destination outside your home country', 400);
  }

  const arrival = stayCities[0];
  const departure = stayCities[stayCities.length - 1];

  const countries = [];
  for (const c of stayCities) {
    if (!countries.some((x) => norm(x) === norm(c.country))) countries.push(c.country);
  }
  const otherCountries = countries.slice(1, -1);

  return { startDate, endDate, arrival, departure, otherCountries };
}

const RESERVATION_VALUES = ['none', 'unconfirmed', 'confirmed'];
const normalizeReservation = (v) => (RESERVATION_VALUES.includes(v) ? v : 'none');

function normalizeInput(payload) {
  requireField(payload?.traveller?.firstName, 'First name');
  requireField(payload?.traveller?.email, 'Email');
  requireField(payload?.visaCountry, 'Country you are applying to');
  requireField(payload?.fromCountry, 'Country you are applying from');
  requireField(payload?.purpose, 'Purpose');

  const segments = normalizeSegments(payload);
  const fromCountry = String(payload.fromCountry).trim();
  const derived = deriveTripFromSegments(segments, fromCountry);

  const firstName = String(payload.traveller.firstName).trim();
  const phone = payload?.traveller?.phone || {};

  return {
    visaCountry: String(payload.visaCountry).trim(),
    fromCountry,
    purpose: String(payload.purpose).trim(),
    travellers: Math.max(1, parseInt(payload.travellers, 10) || 1),
    traveller: {
      firstName,
      fullName: firstName,
      email: String(payload.traveller.email).trim().toLowerCase(),
      phone: {
        code: phone.code ? String(phone.code).trim() : '',
        digits: phone.digits ? String(phone.digits).trim() : '',
      },
    },
    segments,
    reservations: {
      flight: normalizeReservation(payload?.reservations?.flight),
      hotel: normalizeReservation(payload?.reservations?.hotel),
    },
    ...derived,
  };
}

function mergeTripEdit(baseInput, edit) {
  const base = baseInput.toObject ? baseInput.toObject() : { ...baseInput };
  const out = { ...base };

  if (edit?.arrival) out.arrival = normalizePlace(edit.arrival, 'Arrival');
  if (edit?.departure) out.departure = normalizePlace(edit.departure, 'Departure');
  if (edit?.visaCountry) out.visaCountry = String(edit.visaCountry).trim();
  if (edit?.purpose) out.purpose = String(edit.purpose).trim();
  if (Array.isArray(edit?.otherCountries)) {
    out.otherCountries = edit.otherCountries.map((c) => String(c).trim()).filter(Boolean);
  }
  if (edit?.travellers != null) out.travellers = Math.max(1, parseInt(edit.travellers, 10) || 1);
  if (edit?.startDate) out.startDate = String(edit.startDate).trim();
  if (edit?.endDate) out.endDate = String(edit.endDate).trim();

  validateDateRange(out.startDate, out.endDate);
  return out;
}

function itinerarySearchFilter(search) {
  const term = String(search ?? '').trim();
  if (!term) return {};
  const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return {
    $or: [
      { 'input.traveller.fullName': regex },
      { 'input.traveller.firstName': regex },
      { 'input.traveller.email': regex },
      { 'input.visaCountry': regex },
      { 'input.fromCountry': regex },
      { sessionId: regex },
    ],
  };
}

function applyItineraryCreatedAtFilter(queryObj, createdAt) {
  if (!createdAt || createdAt === 'all_time') return;
  const hours = { '6_hours': 6, '12_hours': 12, '24_hours': 24, '7_days': 168, '14_days': 336, '30_days': 720, '90_days': 2160 };
  if (!hours[createdAt]) return;
  queryObj.createdAt = { $gte: new Date(Date.now() - hours[createdAt] * 3_600_000) };
}

export function createItineraryService({
  Order,
  generator,
  pdfRenderer,
  storage,
  sendItineraryEmail,
  stripe,
  frontendUrl,
  frontendPathBase = '/itinerary',
  brand,
  price = 49,
  currency = 'AED',
  freeRegenLimit = 2,
  postPaymentEditLimit = 2,
  editWindowDays = 7,
  chatLimit = 10,
}) {
  function buildMeta(order) {
    const windowOk = order.paidAt && Date.now() - new Date(order.paidAt).getTime() <= editWindowDays * 86_400_000;
    return {
      sessionId: order.sessionId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      regenCount: order.regenCount,
      freeRegenLimit,
      regensRemaining: Math.max(0, freeRegenLimit - order.regenCount),
      chatCount: order.chatCount || 0,
      chatLimit,
      chatsRemaining: Math.max(0, chatLimit - (order.chatCount || 0)),
      editCount: order.editCount,
      postPaymentEditLimit,
      canEditFree: order.paymentStatus === 'PAID' && windowOk && order.editCount < postPaymentEditLimit,
      price: order.price,
      currency: order.currency,
      hasPreview: order.status === 'GENERATED',
      previewVersion: order.previewVersion || 0,
      previewUrl: order.previewUrl || null,
      mainDestinationCheck: computeMainDestination(order.itineraryData, order.input),
      returnTripCheck: computeReturnHome(order.itineraryData, order.input),
      traveller: {
        firstName: order.input.traveller.firstName || order.input.traveller.fullName,
        fullName: order.input.traveller.fullName || order.input.traveller.firstName,
      },
      createdAt: order.createdAt,
      paidAt: order.paidAt,
    };
  }

  async function finalizeItinerary(order) {
    const png = await pdfRenderer.renderPreviewImage(order);
    const nextVersion = (order.previewVersion || 0) + 1;
    order.previewUrl = await storage.saveFile(
      png,
      `${order.sessionId}/preview/previewImage-v${nextVersion}`,
      { resourceType: 'image' },
    );
    order.cleanPdfUrl = null;
    order.previewVersion = nextVersion;
    order.status = 'GENERATED';
    order.lastError = null;
    await order.save();
    return order;
  }

  async function generateAndStore(order) {
    const { input } = order;

    let itineraryData = await generator.generate({ input });
    let result = validateItinerary(itineraryData, input);

    if (!result.valid) {
      logger.warn('[itineraries] First generation failed validation, regenerating once', {
        sessionId: order.sessionId,
        errors: result.errors,
      });
      itineraryData = await generator.generate({ input, validationFeedback: result.errors.join('\n') });
      result = validateItinerary(itineraryData, input);
    }

    if (!result.valid) {
      order.status = 'FAILED';
      order.lastError = result.errors.join('; ');
      order.itineraryData = itineraryData;
      await order.save();
      logger.error('[itineraries] Generation failed validation twice', {
        sessionId: order.sessionId,
        errors: result.errors,
      });
      throw new AppError(
        'We could not produce a consistent itinerary for these dates and cities. Please review your inputs and try again.',
        422,
      );
    }

    order.itineraryData = itineraryData;
    return finalizeItinerary(order);
  }

  function runGeneration(order) {
    return generateAndStore(order).catch(async (err) => {
      logger.error('[itineraries] Background generation error', {
        sessionId: order.sessionId,
        error: err.message,
      });
      if (order.status !== 'FAILED') {
        try {
          order.status = 'FAILED';
          order.lastError = err.message;
          await order.save();
        } catch (saveErr) {
          logger.error('[itineraries] Could not persist FAILED status', {
            sessionId: order.sessionId,
            error: saveErr.message,
          });
        }
      }
    });
  }

  async function ensureCleanPdf(order) {
    if (order.cleanPdfUrl) return order.cleanPdfUrl;
    const pdf = await pdfRenderer.renderCleanPdf(order);
    order.cleanPdfUrl = await storage.saveFile(pdf, `${order.sessionId}/finalPdf/finalPdf`, { resourceType: 'raw' });
    await order.save();
    return order.cleanPdfUrl;
  }

  async function createOrder(payload, ipAddress, files) {
    const input = normalizeInput(payload);
    const order = await Order.create({ input, ipAddress, price, currency, status: 'GENERATING' });
    runGeneration(order);
    if (files?.length) runSupportingDocsUpload(order.sessionId, files);
    return order;
  }

  // Atomic $set: must not clobber fields the concurrent generation is writing.
  function runSupportingDocsUpload(sessionId, files) {
    return (async () => {
      const docs = [];
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const resourceType = file.mimetype === 'application/pdf' ? 'raw' : file.mimetype?.startsWith('image/') ? 'image' : 'raw';
        const url = await storage.saveFile(file.buffer, `${sessionId}/supportingDocuments/doc-${i + 1}`, { resourceType });
        docs.push({ name: file.originalname, url });
      }
      await Order.updateOne({ sessionId }, { $set: { supportingDocuments: docs } });
    })().catch((err) => {
      logger.warn('[itineraries] Supporting documents upload failed', { sessionId, error: err.message });
    });
  }

  async function regenerate(sessionId, ipAddress) {
    const order = await Order.findOne({ sessionId });
    if (!order) throw new AppError('Itinerary not found', 404);

    if (order.paymentStatus === 'PAID') {
      throw new AppError('This itinerary is already paid. Use the edit endpoint instead.', 400);
    }
    if (order.regenCount >= freeRegenLimit) {
      throw new AppError(
        `You have used all ${freeRegenLimit} free regenerations for this itinerary. Please complete your purchase.`,
        429,
      );
    }

    order.regenCount += 1;
    if (ipAddress) order.ipAddress = ipAddress;
    order.status = 'GENERATING';
    await order.save();
    runGeneration(order);
    return order;
  }

  async function getOrderMeta(sessionId) {
    const order = await Order.findOne({ sessionId });
    return order ? buildMeta(order) : null;
  }

  async function getOrderDetail(sessionId) {
    return Order.findOne({ sessionId }).lean();
  }

  async function deleteOrder(sessionId) {
    const order = await Order.findOne({ sessionId });
    if (!order) throw new AppError('Itinerary not found', 404);
    if (order.paymentStatus === 'PAID') {
      throw new AppError('Paid orders cannot be deleted.', 400);
    }
    await Order.deleteOne({ sessionId });
    try {
      await storage?.deleteSubfolder?.(sessionId);
    } catch (err) {
      logger.warn('[itineraries] Cloudinary cleanup after delete failed', { sessionId, error: err.message });
    }
    return order;
  }

  async function listOrders(query = {}) {
    const queryObj = {};
    if (query.paymentStatus && query.paymentStatus !== 'all') queryObj.paymentStatus = query.paymentStatus;
    if (query.status && query.status !== 'all') queryObj.status = query.status;
    applyItineraryCreatedAtFilter(queryObj, query.createdAt);
    const finalQuery = { ...queryObj, ...itinerarySearchFilter(query.search) };

    let page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));
    const total = await Order.countDocuments(finalQuery);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    if (page > totalPages) page = totalPages;

    const data = await Order.find(finalQuery)
      .select('-itineraryData -chatMessages -supportingDocuments -previewUrl -cleanPdfUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data,
      pagination: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    };
  }

  async function getChatMessages(sessionId) {
    const order = await Order.findOne({ sessionId }).select('chatMessages sessionId');
    if (!order) throw new AppError('Itinerary not found', 404);
    return order.chatMessages || [];
  }

  async function applyChatEdit(order, text, history) {
    let applied = null;
    let feedback = null;
    for (let attempt = 0; attempt < 2 && !applied; attempt += 1) {
      try {
        const result = await generator.chat({
          input: order.input,
          itineraryData: order.itineraryData,
          history,
          message: text,
          validationFeedback: feedback,
        });
        const normalizedInput = mergeTripEdit(order.input, result.updatedInput);
        const validation = validateItinerary(result.itinerary, normalizedInput);
        if (validation.valid) {
          applied = { normalizedInput, itinerary: result.itinerary, reply: result.reply };
        } else {
          feedback = validation.errors.join('\n');
        }
      } catch (err) {
        feedback = err instanceof AppError ? err.message : 'Could not apply that change.';
        logger.warn('[itineraries] Chat edit attempt failed', { sessionId: order.sessionId, error: err.message });
      }
    }

    if (!applied) {
      order.status = 'GENERATED';
      order.chatMessages.push({
        role: 'assistant',
        text: "Sorry, I couldn't apply that change. Could you rephrase or be more specific?",
      });
      await order.save();
      return;
    }

    order.input = applied.normalizedInput;
    order.itineraryData = applied.itinerary;
    order.chatCount = (order.chatCount || 0) + 1;
    order.chatMessages.push({ role: 'assistant', text: applied.reply });
    await finalizeItinerary(order);
  }

  function runChatEdit(order, text, history) {
    return applyChatEdit(order, text, history).catch(async (err) => {
      logger.error('[itineraries] Background chat edit error', {
        sessionId: order.sessionId,
        error: err.message,
      });
      try {
        const fresh = await Order.findOne({ sessionId: order.sessionId });
        if (fresh && fresh.status !== 'GENERATED') {
          fresh.status = 'GENERATED';
          fresh.chatMessages.push({
            role: 'assistant',
            text: "Sorry, I couldn't apply that change. Could you rephrase or be more specific?",
          });
          await fresh.save();
        }
      } catch (saveErr) {
        logger.error('[itineraries] Could not settle chat order', {
          sessionId: order.sessionId,
          error: saveErr.message,
        });
      }
    });
  }

  async function chatEdit({ sessionId, message }, ipAddress) {
    const text = typeof message === 'string' ? message.trim() : '';
    if (!text) throw new AppError('Message is required', 400);
    if (text.length > 1000) throw new AppError('Message is too long', 400);

    const order = await Order.findOne({ sessionId });
    if (!order) throw new AppError('Itinerary not found', 404);
    if (order.status !== 'GENERATED') throw new AppError('Itinerary is not ready to edit', 400);
    if (order.paymentStatus === 'PAID') {
      throw new AppError('This itinerary is already paid. Use the edit endpoint instead.', 400);
    }
    if ((order.chatCount || 0) >= chatLimit) {
      throw new AppError(`You have used all ${chatLimit} free AI edits for this itinerary. Please complete your purchase.`, 429);
    }
    if (ipAddress) order.ipAddress = ipAddress;

    const history = (order.chatMessages || []).map((m) => ({ role: m.role, text: m.text }));
    order.chatMessages.push({ role: 'user', text });
    order.status = 'GENERATING';
    await order.save();

    runChatEdit(order, text, history);
    return { messages: order.chatMessages, meta: buildMeta(order) };
  }

  async function getPreviewUrl(sessionId) {
    const order = await Order.findOne({ sessionId }).select('previewUrl');
    if (!order || !order.previewUrl) throw new AppError('Preview not found', 404);
    return order.previewUrl;
  }

  async function createStripeCheckout(sessionId) {
    const order = await Order.findOne({ sessionId });
    if (!order) throw new AppError('Itinerary not found', 404);
    if (order.status !== 'GENERATED') throw new AppError('Itinerary is not ready for checkout', 400);
    if (order.paymentStatus === 'PAID') throw new AppError('This itinerary has already been paid', 400);

    return stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: order.input.traveller.email,
        invoice_creation: { enabled: true },
        metadata: {
          productType: 'itinerary',
          entity: 'TRAVEL_ITINERARY',
          sessionId,
          customer: order.input.traveller.fullName,
          visaCountry: order.input.visaCountry,
        },
        line_items: [
          {
            price_data: {
              currency: String(order.currency || currency).toLowerCase(),
              unit_amount: Math.round(Number(order.price || price) * 100),
              product_data: { name: `Travel Itinerary — ${order.input.visaCountry} visa` },
            },
            quantity: 1,
          },
        ],
        success_url: `${frontendUrl}${frontendPathBase}/${sessionId}/success`,
        cancel_url: `${frontendUrl}${frontendPathBase}/${sessionId}`,
      },
      { idempotencyKey: sessionId },
    );
  }

  async function handleStripeSuccess(session) {
    if (session.payment_status !== 'paid') return;
    const sessionId = session.metadata?.sessionId;
    if (!sessionId) throw new Error('[itineraries] Stripe session missing sessionId metadata');

    const order = await Order.findOne({ sessionId });
    if (!order) throw new Error(`[itineraries] Order not found for sessionId: ${sessionId}`);

    if (order.paymentStatus === 'PAID') return; // idempotent

    order.paymentStatus = 'PAID';
    order.transactionId = session.id;
    order.amountPaid = {
      currency: (session.currency || order.currency || 'aed').toUpperCase(),
      amount: Number(((session.amount_total ?? 0) / 100).toFixed(2)),
    };
    order.paidAt = new Date();
    await order.save();

    try {
      await ensureCleanPdf(order);
    } catch (err) {
      logger.warn('[itineraries] Post-payment clean PDF pre-render failed', {
        sessionId,
        error: err.message,
      });
    }

    if (typeof sendItineraryEmail === 'function') {
      try {
        await sendItineraryEmail({
          email: order.input.traveller.email,
          name: order.input.traveller.fullName || order.input.traveller.firstName,
          sessionId,
          visaCountry: order.input.visaCountry,
          startDate: order.input.startDate,
          endDate: order.input.endDate,
          fromCity: order.input.arrival?.city,
          toCity: order.input.departure?.city,
          pdfUrl: order.cleanPdfUrl,
        });
      } catch (err) {
        logger.warn('[itineraries] Itinerary email failed', { sessionId, error: err.message });
      }
    }
  }

  async function getCleanPdfUrl(sessionId) {
    const order = await Order.findOne({ sessionId });
    if (!order) throw new AppError('Itinerary not found', 404);
    if (order.paymentStatus !== 'PAID') throw new AppError('Payment required', 402);
    return ensureCleanPdf(order);
  }

  async function editAfterPayment(sessionId, updates, ipAddress) {
    const order = await Order.findOne({ sessionId });
    if (!order) throw new AppError('Itinerary not found', 404);
    if (order.paymentStatus !== 'PAID') throw new AppError('Only paid itineraries can be edited', 400);

    const windowOk = order.paidAt && Date.now() - new Date(order.paidAt).getTime() <= editWindowDays * 86_400_000;
    if (!windowOk || order.editCount >= postPaymentEditLimit) {
      throw new AppError(
        `Your free edits (${postPaymentEditLimit} within ${editWindowDays} days) have been used. A paid revision is required.`,
        402,
      );
    }

    const merged = mergeTripEdit(order.input, updates);
    order.input = merged;
    order.editCount += 1;
    if (ipAddress) order.ipAddress = ipAddress;
    order.status = 'GENERATING';
    await order.save();

    runPaidEdit(order);
    return order;
  }

  function runPaidEdit(order) {
    return generateAndStore(order)
      .then(() => ensureCleanPdf(order))
      .catch(async (err) => {
        logger.error('[itineraries] Background post-payment edit error', {
          sessionId: order.sessionId,
          error: err.message,
        });
        if (order.status !== 'FAILED') {
          try {
            order.status = 'FAILED';
            order.lastError = err.message;
            await order.save();
          } catch (saveErr) {
            logger.error('[itineraries] Could not persist FAILED status', {
              sessionId: order.sessionId,
              error: saveErr.message,
            });
          }
        }
      });
  }

  async function parseDocuments(files) {
    if (!files || files.length === 0) throw new AppError('No documents uploaded', 400);
    const result = await generator.parseDocuments({ files });
    const segments = (result.segments || [])
      .map((s) => ({
        from: { city: String(s?.from?.city ?? '').trim(), country: String(s?.from?.country ?? '').trim() },
        to: { city: String(s?.to?.city ?? '').trim(), country: String(s?.to?.country ?? '').trim() },
        date: isValidDateString(String(s?.date ?? '').trim()) ? String(s.date).trim() : '',
      }))
      .filter((s) => s.from.city || s.to.city || s.date);
    return {
      segments,
      reservations: {
        flight: normalizeReservation(result.flightReservation),
        hotel: normalizeReservation(result.hotelReservation),
      },
    };
  }

  return {
    createOrder,
    parseDocuments,
    regenerate,
    getOrderMeta,
    listOrders,
    getOrderDetail,
    deleteOrder,
    getPreviewUrl,
    createStripeCheckout,
    handleStripeSuccess,
    getCleanPdfUrl,
    editAfterPayment,
    chatEdit,
    getChatMessages,
  };
}
