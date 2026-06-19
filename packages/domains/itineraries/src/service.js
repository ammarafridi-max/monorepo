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

// Derives the trip "core" (arrival, departure, dates, intermediate countries)
// from the ordered segments. The day-by-day itinerary covers the destination
// portion: day 1 is the first destination; the last day is the city the
// traveller departs from on the final leg home.
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

// Form path: validates contact + segments and derives the trip core.
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

// Chat / post-payment edit path: overrides only the trip-core fields on an
// existing canonical input, preserving contact, segments, and reservations.
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

export function createItineraryService({
  Order,
  generator,
  pdfRenderer,
  stripe,
  frontendUrl,
  // Base path of the itinerary pages in the host frontend (e.g. '/travel-itinerary').
  // Used to build Stripe success/cancel URLs so this domain can mount anywhere.
  frontendPathBase = '/itinerary',
  brand,
  price = 49,
  currency = 'AED',
  freeRegenLimit = 2,
  postPaymentEditLimit = 2,
  editWindowDays = 7,
  chatLimit = 10,
}) {
  // Single source of truth for the client-facing metadata (never includes the
  // clean itinerary content).
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
      // Advisory main-destination (Schengen) check — recomputed from the current
      // itinerary on every meta build, so it always reflects the latest change.
      mainDestinationCheck: computeMainDestination(order.itineraryData, order.input),
      // Advisory return-trip check — same plumbing; flags a trip that doesn't end
      // back in the home country (no return flight booked).
      returnTripCheck: computeReturnHome(order.itineraryData, order.input),
      traveller: {
        firstName: order.input.traveller.firstName || order.input.traveller.fullName,
        fullName: order.input.traveller.fullName || order.input.traveller.firstName,
      },
      createdAt: order.createdAt,
      paidAt: order.paidAt,
    };
  }
  // Centralised post-change finalisation. Every path that changes the itinerary
  // JSON (generate, regenerate, chat, post-payment edit) ends here AFTER the
  // content has passed validateItinerary. Re-renders the watermarked preview,
  // invalidates the cached clean PDF, bumps previewVersion (cache-busts the
  // preview image), marks GENERATED, and persists. The main-destination result
  // is derived in buildMeta, so it is refreshed on the next meta build.
  async function finalizeItinerary(order) {
    order.previewImage = await pdfRenderer.renderPreviewImage(order);
    order.cleanPdf = null;
    order.previewVersion = (order.previewVersion || 0) + 1;
    order.status = 'GENERATED';
    order.lastError = null;
    await order.save();
    return order;
  }

  // -- Core: generate -> validate -> regenerate once -> finalize -------------
  // Code owns validation. On failure we auto-regenerate exactly once, then
  // surface an error rather than ship a contradictory document.
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
      // Keep the rejected output for debugging. Never served: preview requires a
      // rendered image and the clean PDF requires payment, neither of which a
      // FAILED order has.
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

  // Fire-and-forget wrapper for background generation. We don't hold the HTTP
  // request open for the full Claude + render cycle (it can exceed the client's
  // timeout) — the caller returns immediately with status GENERATING and the
  // client polls until GENERATED/FAILED. generateAndStore marks FAILED on
  // validation failure; this guarantees FAILED on any other error (Claude,
  // network, render) too, so a poller never hangs on GENERATING forever.
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
    if (order.cleanPdf) return order.cleanPdf;
    const pdf = await pdfRenderer.renderCleanPdf(order);
    order.cleanPdf = pdf;
    await order.save();
    return pdf;
  }

  // -- Public API ------------------------------------------------------------

  async function createOrder(payload, ipAddress) {
    const input = normalizeInput(payload);
    const order = await Order.create({ input, ipAddress, price, currency, status: 'GENERATING' });
    // Generate in the background; respond immediately so the client can redirect
    // and poll. (Synchronous generation here used to exceed the client timeout.)
    runGeneration(order);
    return order;
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

    // Count the attempt regardless of outcome — each generation is a paid AI call.
    order.regenCount += 1;
    if (ipAddress) order.ipAddress = ipAddress;
    order.status = 'GENERATING';
    await order.save();
    // Same background pattern as createOrder — the client polls for completion.
    runGeneration(order);
    return order;
  }

  async function getOrderMeta(sessionId) {
    const order = await Order.findOne({ sessionId });
    return order ? buildMeta(order) : null;
  }

  async function getChatMessages(sessionId) {
    const order = await Order.findOne({ sessionId }).select('chatMessages sessionId');
    if (!order) throw new AppError('Itinerary not found', 404);
    return order.chatMessages || [];
  }

  // Background worker for a conversational edit. Asks the model to apply the
  // change, then validates against the (possibly updated) trip parameters; one
  // retry with validation feedback. On a validated edit it consumes one unit of
  // chat budget, appends the assistant reply, and re-renders (finalizeItinerary,
  // status GENERATED). On an unparseable/invalid edit it appends a graceful reply,
  // consumes NO budget, leaves the itinerary untouched, and returns to GENERATED.
  // `history` is the conversation snapshot BEFORE the new user message was added.
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
      // Graceful no-op: reply, no budget consumed, itinerary unchanged, back to
      // GENERATED (no re-render — previewVersion stays the same).
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
    await finalizeItinerary(order); // validated above; re-render, bump version, status GENERATED, persist
  }

  // Fire-and-forget wrapper for a background chat edit (same shape as
  // runGeneration). Guarantees the order settles back to GENERATED with an
  // assistant reply even on a hard error — a chat failure must never leave the
  // order stuck on GENERATING or brick the existing (valid) itinerary, so on
  // error we re-fetch a clean copy (discarding any half-applied in-memory edit),
  // mark GENERATED, and append a graceful reply. The client polls until settled.
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

  // Conversational edit: apply a natural-language change to the itinerary.
  // Pre-payment only; bounded by a per-session chat budget (margin protection).
  // The Claude call + validation + re-render can exceed the client timeout, so it
  // runs in the BACKGROUND (same async+poll pattern as generate/regenerate): we
  // record the user message, flip to GENERATING, and return immediately; the
  // client polls GET /:id (status) and GET /:id/chat (reply) until settled.
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

    // Snapshot the conversation BEFORE adding the new message (history for the
    // model), then record the user message and flip to GENERATING so the client
    // can poll. The status guard above also blocks a second concurrent edit.
    const history = (order.chatMessages || []).map((m) => ({ role: m.role, text: m.text }));
    order.chatMessages.push({ role: 'user', text });
    order.status = 'GENERATING';
    await order.save();

    runChatEdit(order, text, history);
    return { messages: order.chatMessages, meta: buildMeta(order) };
  }

  async function getPreviewImage(sessionId) {
    const order = await Order.findOne({ sessionId }).select('+previewImage');
    if (!order || !order.previewImage) throw new AppError('Preview not found', 404);
    return order.previewImage;
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

    // Pre-render the clean PDF so the first download is instant. Best-effort —
    // never fail a confirmed payment over a render hiccup (renders on demand later).
    try {
      await ensureCleanPdf(order);
    } catch (err) {
      logger.warn('[itineraries] Post-payment clean PDF pre-render failed', {
        sessionId,
        error: err.message,
      });
    }
  }

  // Clean, watermark-free PDF — only ever served after payment.
  async function getCleanPdf(sessionId) {
    const order = await Order.findOne({ sessionId }).select('+cleanPdf');
    if (!order) throw new AppError('Itinerary not found', 404);
    if (order.paymentStatus !== 'PAID') throw new AppError('Payment required', 402);
    return ensureCleanPdf(order);
  }

  // Post-payment edit: 2 free edits within 7 days, then a paid revision.
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

    // Apply the trip-core edits onto the existing input (keeps contact/segments).
    const merged = mergeTripEdit(order.input, updates);
    order.input = merged;
    order.editCount += 1;
    if (ipAddress) order.ipAddress = ipAddress;
    order.status = 'GENERATING';
    await order.save();

    // Background regenerate + clean-PDF refresh (same async+poll pattern); the
    // client polls until the order settles. (No frontend caller wires this yet.)
    runPaidEdit(order);
    return order;
  }

  // Fire-and-forget wrapper for a post-payment edit: regenerate (re-validate +
  // re-render watermarked preview) then refresh the already-paid clean PDF.
  // generateAndStore settles FAILED on validation failure; this guarantees FAILED
  // on any other error too, so a poller never hangs on GENERATING.
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

  // Reads uploaded documents and returns segments + reservation flags to prefill
  // the form. Does NOT create an order.
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
    getPreviewImage,
    createStripeCheckout,
    handleStripeSuccess,
    getCleanPdf,
    editAfterPayment,
    chatEdit,
    getChatMessages,
  };
}
