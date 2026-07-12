// MUST be the first import: it initialises Sentry before express is loaded (so the
// SDK can instrument it) and loads the root .env before the dotenv.config() below.
import { Sentry, sentryEnabled, captureError } from './instrument.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { Readable } from 'node:stream';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

// Load the monorepo-root .env regardless of the cwd this service is started from
// (pnpm --filter runs scripts with the package dir as cwd).
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

import Stripe from 'stripe';
import { Queue } from 'bullmq';
import {
  connectMongo,
  createRedisConnection,
  createStorage,
  isValidLook,
  isValidAttire,
  isValidAgeRange,
  isValidGender,
  isValidRace,
  isValidFacialHair,
  Order,
  ORDER_STATES,
  OrderTransitionConflictError,
  QUEUE_NAMES,
  transitionOrder,
} from '@picturesk/shared';
import { detectFaces } from './faceDetector.js';
import { moderateImage, MODERATION_REASON } from './contentModerator.js';
import { QUALITY, evaluateImages, countError } from './uploadGate.js';
import { RATE_LIMITS, createRateLimiters } from './rateLimit.js';

/**
 * Picturesk API (Phase 4: uploads + delivery).
 *
 * - POST /uploads/presign returns presigned PUT URLs so the browser uploads
 *   selfies DIRECTLY to R2. Bytes never pass through this service.
 * - POST /checkout creates an order with the customer's real uploaded image URLs
 *   and a Stripe Checkout Session. The server owns the price.
 * - POST /webhooks/stripe is the idempotency boundary: one atomic write
 *   (AWAITING_PAYMENT -> PAID) and one enqueue.
 * - GET /orders/:id returns a PUBLIC view (no cost, no Stripe/Replicate internals)
 *   for the success page to poll.
 */

// The server owns the price. Never trust the client for money.
const PRICE_CENTS = 3500;
// Reject absurd upload batches. A face fine-tune wants ~10-15 photos.
const MAX_UPLOAD_FILES = 20;

// Canonical image extension per content type. The stored R2 key MUST end in a
// recognizable image extension: the face detector (yolov8 on Replicate) fetches
// the public URL and infers the format from its EXTENSION, so a key without one
// (an extension-less or oddly-named upload) makes detection fail with "no image
// found" and the photo is wrongly rejected as unreadable. We append the right
// extension so every uploaded image is detectable.
const IMAGE_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/avif': 'avif',
};
const HAS_IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|tiff?|heic|heif|avif)$/i;
// A non-terminal order sitting longer than this is flagged as stuck by the admin
// view, so a stall is visible without a customer emailing us. Env-overridable.
const STUCK_AFTER_MS = (Number(process.env.ADMIN_STUCK_MINUTES) || 30) * 60 * 1000;

const {
  MONGODB_URI,
  REDIS_URL,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  ADMIN_TOKEN,
  WEB_BASE_URL = 'http://localhost:3000',
  PORT = 3001,
} = process.env;
if (!MONGODB_URI) throw new Error('[api] MONGODB_URI is required');
if (!REDIS_URL) throw new Error('[api] REDIS_URL is required');
if (!STRIPE_SECRET_KEY) throw new Error('[api] STRIPE_SECRET_KEY is required');
if (!STRIPE_WEBHOOK_SECRET) throw new Error('[api] STRIPE_WEBHOOK_SECRET is required');

// The upload quality gate is on by default and fails closed. Set
// UPLOAD_QUALITY_GATE=off ONLY for local dev without a vision provider; doing so
// re-opens the "pay for garbage input" hole the gate exists to close.
const UPLOAD_QUALITY_GATE = (process.env.UPLOAD_QUALITY_GATE ?? 'on') !== 'off';
if (!UPLOAD_QUALITY_GATE) {
  console.warn('[api] UPLOAD_QUALITY_GATE=off: accepting all uploads without face validation (dev only)');
}

// How many images the gate processes at once. Small on purpose: the vision
// provider rate-limits bursts (env-overridable if you raise your limits). Note
// each image now makes up to TWO Replicate calls (face + moderation), run in
// parallel per image, so effective concurrency against Replicate is ~2x this.
const DETECT_CONCURRENCY = Number.parseInt(process.env.UPLOAD_DETECT_CONCURRENCY, 10) || 4;

// Content moderation is ON by default and, like the quality gate, is the real
// server-side gate. Set UPLOAD_MODERATION=off ONLY for local dev without a
// classifier wired up.
const UPLOAD_MODERATION = (process.env.UPLOAD_MODERATION ?? 'on') !== 'off';
// What to do when the classifier ITSELF errors (outage, misconfig, bad model).
// Default fail OPEN (allow + alert) so a moderation outage does not take down
// every checkout; set to "false" to fail CLOSED (block) for strict enforcement.
// A POSITIVE detection is always blocked regardless of this setting.
const MODERATION_FAIL_OPEN = (process.env.UPLOAD_MODERATION_FAIL_OPEN ?? 'true') !== 'false';
if (UPLOAD_MODERATION && MODERATION_FAIL_OPEN) {
  console.log('[api] content moderation ON (fail-open on classifier errors)');
} else if (UPLOAD_MODERATION) {
  console.log('[api] content moderation ON (fail-closed on classifier errors)');
} else {
  console.warn('[api] UPLOAD_MODERATION=off: not screening uploads for unsafe content (dev only)');
}

/**
 * Map over items running at most `limit` async fns concurrently, preserving
 * input order in the result. Keeps the upload gate from firing every image at
 * the vision provider simultaneously.
 */
async function mapWithLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  const size = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: size }, worker));
  return results;
}

await connectMongo(MONGODB_URI);
console.log('[api] connected to MongoDB');

const stripe = new Stripe(STRIPE_SECRET_KEY);

const connection = createRedisConnection(REDIS_URL);
const orderPipeline = new Queue(QUEUE_NAMES.ORDER_PIPELINE, { connection });

// Enqueue options shared by every producer of the pipeline. jobId = orderId
// makes the enqueue idempotent: the same order can never be queued twice.
function pipelineJobOpts(orderId) {
  return {
    jobId: orderId,
    // A run spans a multi-minute Replicate training we don't control, so give it
    // several reattach attempts before we give up and refund. Reattach is
    // idempotent (never retrains, never regenerates a started slot), so extra
    // attempts are safe.
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
  };
}

/**
 * The PUBLIC projection of an order. Everything the success page needs, and
 * nothing it should not see: no computeCostCents (our margin), no Stripe ids, no
 * Replicate training internals.
 */
function toPublicOrder(order) {
  const isDelivered = order.status === ORDER_STATES.DELIVERED;
  const isGenerating = order.status === ORDER_STATES.GENERATING;

  // Serve ONLY the culled best set (deliveredImageUrls), and ONLY once DELIVERED.
  // During GENERATING the culled set is not known yet: selection/culling runs
  // AFTER all candidates finish, so any completed candidate shown now could be a
  // bad seed (gender flip / beard drop) that later gets culled out. Showing it
  // then removing it would flash a broken image at the customer. So we expose NO
  // images while generating (Option A) and surface progress as plain counts
  // instead. Legacy fallback: orders delivered before candidate selection shipped
  // have no deliveredImageUrls, so fall back to resultImageUrls (which, for those
  // orders, IS the delivered set) so historical results still show.
  const resultImageUrls = isDelivered
    ? (order.deliveredImageUrls?.length ? order.deliveredImageUrls : (order.resultImageUrls ?? []))
    : [];

  // Live generation progress: COUNTS ONLY, never image URLs, per-candidate scores,
  // or cost. generatedCount = candidate images finished so far; totalCount = the
  // candidate slots the worker has started (generationIds is persisted before
  // polling, so it reflects the full target as soon as generation kicks off).
  // Gated to GENERATING so we never reveal how many candidates we generate once
  // the order is delivered. Both are safe non-negative integers.
  const generatedCount = isGenerating ? (order.resultImageUrls?.length ?? 0) : 0;
  const totalCount = isGenerating ? (order.replicate?.generationIds?.length ?? 0) : 0;

  return {
    orderId: order._id.toString(),
    status: order.status,
    customerEmail: order.customerEmail,
    // The customer's choices, so the upload/status pages can render a summary.
    // Catalog ids only, never internal prompt fragments.
    selectedLooks: order.selectedLooks ?? [],
    selectedAttire: order.selectedAttire ?? [],
    resultImageUrls,
    generatedCount,
    totalCount,
    createdAt: order.createdAt,
    deliveredAt: order.deliveredAt ?? null,
    // A calm, non-technical hint for a failed order, so the success page can say
    // whether the payment has been refunded.
    failed: order.status === ORDER_STATES.FAILED,
    refunded: Boolean(order.refundedAt),
  };
}

// When did the order ENTER its current state? Used to measure how long it has
// been sitting there (only meaningful for non-terminal states).
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
      return null; // terminal: DELIVERED / FAILED
  }
}

/**
 * The ADMIN projection. The payoff of stamping a timestamp on every transition:
 * a stall becomes visible (stuckFor + stuck) and per-order profit becomes visible
 * (marginCents) without any extra machinery.
 */
function toAdminOrder(order) {
  const enteredAt = enteredCurrentStateAt(order);
  const stuckForMs = enteredAt ? Date.now() - new Date(enteredAt).getTime() : null;
  const marginCents =
    order.status === ORDER_STATES.DELIVERED && typeof order.amountPaidCents === 'number'
      ? order.amountPaidCents - (order.computeCostCents || 0)
      : null;

  return {
    orderId: order._id.toString(),
    status: order.status,
    customerEmail: order.customerEmail,
    amountPaidCents: order.amountPaidCents ?? null,
    computeCostCents: order.computeCostCents ?? 0,
    marginCents,
    stuckForMs,
    stuckForMinutes: stuckForMs == null ? null : Math.round(stuckForMs / 60000),
    stuck: stuckForMs != null && stuckForMs > STUCK_AFTER_MS,
    createdAt: order.createdAt,
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

/**
 * THE REAL upload gate: count + face quality + content moderation on the uploaded
 * images. Returns a { status, body } to send back on failure, or null if
 * everything passes. Runs inside POST /checkout, BEFORE the Stripe session is
 * created, so no failing input can be paid for. Structured 422 shapes let the
 * client show per-photo reasons and let the user swap photos.
 */
async function runUploadGate(uploadedImageUrls) {
  if (!(UPLOAD_QUALITY_GATE || UPLOAD_MODERATION)) return null;

  const nErr = countError(uploadedImageUrls.length);
  if (nErr) {
    return { status: 422, body: { error: 'quality_gate', countError: nErr, failures: [], rules: QUALITY } };
  }

  // Bounded concurrency (firing all N at Replicate at once trips its rate limit).
  // Face detection and moderation run in PARALLEL per image, so moderation adds no
  // latency, only ~1 extra Replicate prediction per image in cost.
  const results = await mapWithLimit(uploadedImageUrls, DETECT_CONCURRENCY, async (url, index) => {
    const [face, moderation] = await Promise.all([
      UPLOAD_QUALITY_GATE
        ? detectFaces(url).catch((err) => {
            // Fail closed on a per-image detection error: an unreadable image is
            // not allowed to buy its way through.
            console.error(`[api] face detection failed for ${url}: ${err.message}`);
            captureError(err, { route: 'orders/images', phase: 'face-detection' });
            return { faceCount: 0, maxFaceBoxRatio: 0, error: true };
          })
        : Promise.resolve(null),
      UPLOAD_MODERATION
        ? moderateImage(url).catch((err) => {
            // The classifier ITSELF errored. Fail open (allow + alert) or closed
            // per MODERATION_FAIL_OPEN. A positive detection never reaches this
            // catch, so it is always blocked below.
            console.error(`[api] moderation failed for ${url}: ${err.message}`);
            captureError(err, { route: 'orders/images', phase: 'moderation' });
            return { safe: MODERATION_FAIL_OPEN, score: null, reason: MODERATION_REASON, errored: true };
          })
        : Promise.resolve({ safe: true }),
    ]);
    return { index, url, face, moderation };
  });

  // 1) SAFETY FIRST. Reject unsafe images with a non-graphic, branded reason; we
  //    never say what was detected.
  if (UPLOAD_MODERATION) {
    const unsafe = results
      .filter((r) => !r.moderation.safe)
      .map((r) => ({ index: r.index, reason: r.moderation.reason || MODERATION_REASON }));
    if (unsafe.length) {
      return { status: 422, body: { error: 'content_moderation', failures: unsafe } };
    }
  }

  // 2) Then quality (face presence / size).
  if (UPLOAD_QUALITY_GATE) {
    const failures = evaluateImages(results.map((r) => ({ index: r.index, url: r.url, ...r.face })));
    if (failures.length) {
      return { status: 422, body: { error: 'quality_gate', failures, rules: QUALITY } };
    }
  }

  return null;
}

// Constant-time bearer-token check for the admin route.
function adminAuthorized(req) {
  if (!ADMIN_TOKEN) return false;
  const provided =
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '') ||
    req.headers['x-admin-token'] ||
    '';
  const a = Buffer.from(String(provided));
  const b = Buffer.from(ADMIN_TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

const app = express();

// Behind Fly.io the real client IP is in X-Forwarded-For, appended by ONE proxy
// hop. Tell Express exactly how many hops to trust so req.ip (what the rate
// limiter keys on) is the true client, not the proxy and not a spoofable header.
// A specific number, never `true`: `true` would let a client forge XFF and dodge
// the limit. Override TRUST_PROXY_HOPS if you add more proxies in front.
const TRUST_PROXY_HOPS = Number.parseInt(process.env.TRUST_PROXY_HOPS, 10);
app.set('trust proxy', Number.isFinite(TRUST_PROXY_HOPS) ? TRUST_PROXY_HOPS : 1);

const { globalLimiter, presignLimiter, checkoutLimiter } = createRateLimiters(RATE_LIMITS);

// The web app is a separate origin (localhost:3000 in dev). Allow it to call
// the JSON endpoints. The webhook is server-to-server and needs no CORS.
app.use(cors({ origin: WEB_BASE_URL }));

/**
 * POST /webhooks/stripe  --  THE critical surface. Verify, one atomic write,
 * enqueue, 200. Nothing slow, no Replicate.
 *
 * This route is mounted BEFORE app.use(express.json()) and uses express.raw so
 * the JSON parser never runs on this path: stripe.webhooks.constructEvent needs
 * the exact raw bytes to verify the signature.
 */
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`[api] webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // We only care about a completed checkout. Acknowledge everything else.
  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;

  try {
    // a. Find the order this session belongs to.
    const order = await Order.findOne({ stripeSessionId: session.id });
    if (!order) {
      // Should not happen given our flow: we always store the session id first.
      console.error(
        `[api] webhook: no order for checkout session ${session.id} (should not happen)`
      );
      return res.status(200).json({ received: true });
    }

    const orderId = order._id.toString();

    // b. Idempotent + atomic. Money figures come from STRIPE, never the client.
    //    The order was created at checkout already carrying selections + images,
    //    so payment is the last gate before the pipeline runs.
    try {
      await transitionOrder(orderId, ORDER_STATES.AWAITING_PAYMENT, ORDER_STATES.PAID, {
        amountPaidCents: session.amount_total,
        stripePaymentIntentId: session.payment_intent,
      });
    } catch (err) {
      // Already paid (a Stripe retry) or not in AWAITING_PAYMENT: do not enqueue
      // again, but still acknowledge so Stripe stops retrying.
      if (err instanceof OrderTransitionConflictError) {
        console.log(
          `[api] webhook: order ${orderId} already processed (Stripe retry), skipping enqueue`
        );
        return res.status(200).json({ received: true });
      }
      throw err;
    }

    // c. Transition succeeded -> hand the order to the pipeline exactly once.
    await orderPipeline.add('process-order', { orderId }, pipelineJobOpts(orderId));
    console.log(`[api] webhook: order ${orderId} PAID and enqueued`);

    return res.status(200).json({ received: true });
  } catch (err) {
    // Unexpected failure: 500 lets Stripe retry the delivery later.
    console.error('[api] webhook handler error:', err);
    captureError(err, { route: 'webhooks/stripe' });
    return res.status(500).json({ error: err.message });
  }
});

// Every route below this line gets a parsed JSON body.
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Global per-IP backstop on every route BELOW this line. Mounted after the
// webhook (which is registered earlier and must never be throttled) and after
// /health (so Fly.io health checks are never limited).
app.use(globalLimiter);

/**
 * POST /uploads/presign  --  hand the browser presigned PUT URLs so it uploads
 * selfies DIRECTLY to R2. We never see the bytes. Strict per-IP limit on top of
 * the global one: this creates storage keys and is a prime abuse target.
 *
 * Body: { files: [{ filename, contentType }] }
 * Returns: { uploads: [{ uploadUrl, publicUrl, key, contentType }] }
 */
app.post('/uploads/presign', presignLimiter, async (req, res) => {
  try {
    const { files } = req.body ?? {};
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'files must be a non-empty array' });
    }
    if (files.length > MAX_UPLOAD_FILES) {
      return res.status(400).json({ error: `at most ${MAX_UPLOAD_FILES} files` });
    }
    for (const f of files) {
      if (!f || typeof f.contentType !== 'string' || !f.contentType.startsWith('image/')) {
        return res.status(400).json({ error: 'each file needs an image/* contentType' });
      }
    }

    const storage = createStorage();
    const uploads = await Promise.all(
      files.map(async (f) => {
        // A fresh uuid folder per file keeps names unique and un-guessable.
        const raw = String(f.filename || 'photo').replace(/[^a-zA-Z0-9._-]/g, '_');
        // Guarantee a recognizable image extension on the key (see IMAGE_EXT), so
        // downstream face detection never fails on an extension-less filename.
        const ext = IMAGE_EXT[String(f.contentType).toLowerCase()] || 'jpg';
        const safeName = HAS_IMAGE_EXT.test(raw) ? raw : `${raw}.${ext}`;
        const key = `uploads/${randomUUID()}/${safeName}`;
        const uploadUrl = await storage.presignPut(key, f.contentType);
        return { uploadUrl, publicUrl: storage.publicUrl(key), key, contentType: f.contentType };
      })
    );

    return res.json({ uploads });
  } catch (err) {
    console.error('[api] POST /uploads/presign failed:', err);
    captureError(err, { route: 'uploads/presign' });
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /checkout  --  create the order (selections AND the customer's already
 * uploaded photos) and a real Stripe Checkout Session. Payment is the LAST step:
 * the photos were uploaded direct-to-R2 before this call and their URLs are passed
 * in here.
 *
 * THE REAL GATE runs here, BEFORE the Stripe session is created, so there is no
 * session (no payment) for input that would train a bad model. The server owns the
 * price; the client cannot influence what is charged.
 *
 * Body: { email, selectedLooks[], selectedAttire[], uploadedImageUrls[] }
 */
app.post('/checkout', checkoutLimiter, async (req, res) => {
  try {
    const {
      email,
      selectedLooks,
      selectedAttire,
      uploadedImageUrls,
      gender,
      ageRange,
      race,
      facialHair,
    } = req.body ?? {};
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }
    if (!Array.isArray(selectedLooks) || selectedLooks.length === 0) {
      return res.status(400).json({ error: 'selectedLooks must be a non-empty array' });
    }
    if (!Array.isArray(selectedAttire) || selectedAttire.length === 0) {
      return res.status(400).json({ error: 'selectedAttire must be a non-empty array' });
    }
    if (!Array.isArray(uploadedImageUrls) || uploadedImageUrls.length === 0) {
      return res.status(400).json({ error: 'uploadedImageUrls must be a non-empty array' });
    }
    // Validate selections against the shared catalog so a tampered client cannot
    // store junk ids the worker would later fail to turn into prompts.
    if (!selectedLooks.every(isValidLook)) {
      return res.status(400).json({ error: 'selectedLooks contains an unknown look id' });
    }
    if (!selectedAttire.every(isValidAttire)) {
      return res.status(400).json({ error: 'selectedAttire contains an unknown attire id' });
    }
    // Subject demographics: gender + ageRange are required (the select step asks
    // for both and they lead every prompt); race is optional. Validate any value
    // present against the shared catalog so a tampered client cannot store junk.
    if (!isValidGender(gender)) {
      return res.status(400).json({ error: 'gender is required and must be a known option' });
    }
    if (!isValidAgeRange(ageRange)) {
      return res.status(400).json({ error: 'ageRange is required and must be a known option' });
    }
    if (race != null && race !== '' && !isValidRace(race)) {
      return res.status(400).json({ error: 'race contains an unknown option' });
    }
    // facialHair is optional (names the beard in the prompt so it does not drift).
    if (facialHair != null && facialHair !== '' && !isValidFacialHair(facialHair)) {
      return res.status(400).json({ error: 'facialHair contains an unknown option' });
    }

    // THE REAL GATE (face quality + content moderation), BEFORE any Stripe session.
    // The web client runs the same face checks for fast feedback, but that is UX
    // only and can be bypassed by calling /checkout directly, so we re-validate
    // every image here and REFUSE to create the session on failure. No session =
    // no payment for input that would train a bad model and then "succeed" into a
    // DELIVERED order that never triggers the FAILED auto-refund.
    const gate = await runUploadGate(uploadedImageUrls);
    if (gate) return res.status(gate.status).json(gate.body);

    // Create the order in AWAITING_PAYMENT with selections + images. amountPaidCents
    // is written from Stripe in the webhook once payment confirms.
    const order = await Order.create({
      customerEmail: email,
      selectedLooks,
      selectedAttire,
      gender,
      ageRange,
      race: race || undefined,
      facialHair: facialHair || undefined,
      uploadedImageUrls,
    });
    const orderId = order._id.toString();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: PRICE_CENTS,
            product_data: { name: 'Picturesk professional headshots' },
          },
        },
      ],
      metadata: { orderId },
      success_url: `${WEB_BASE_URL}/success?orderId=${orderId}`,
      // Cancel returns to the pay step so they can retry (a new order).
      cancel_url: `${WEB_BASE_URL}/generator/pay`,
    });

    // The session id is our idempotency anchor: the webhook finds the order by it.
    order.stripeSessionId = session.id;
    await order.save();

    return res.status(201).json({ orderId, checkoutUrl: session.url });
  } catch (err) {
    console.error('[api] POST /checkout failed:', err);
    captureError(err, { route: 'checkout' });
    return res.status(500).json({ error: err.message });
  }
});

// GET /orders/:id  --  the success page polls this. Returns the PUBLIC view only.
app.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'order not found' });
    return res.json(toPublicOrder(order));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * GET /orders/:id/download/:index  --  stream one delivered headshot back with
 * Content-Disposition: attachment so the browser DOWNLOADS it instead of opening
 * it in a new tab (the <a download> attribute is ignored for cross-origin URLs).
 *
 * The delivered images are hosted by Replicate (replicate.delivery), not in our
 * R2 bucket, so we fetch the stored URL server-side and re-stream it with the
 * attachment header. The URL is not a request parameter: it is read from the
 * order in our own DB and selected by a validated index, so there is no SSRF
 * surface, and we only ever serve the same culled set the success page shows.
 */
app.get('/orders/:id/download/:index', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'order not found' });

    // Same projection the success page renders: the culled delivered set once
    // DELIVERED, with the legacy fallback to resultImageUrls.
    const urls =
      order.status === ORDER_STATES.DELIVERED
        ? order.deliveredImageUrls?.length
          ? order.deliveredImageUrls
          : (order.resultImageUrls ?? [])
        : [];

    const index = Number.parseInt(req.params.index, 10);
    if (!Number.isInteger(index) || index < 0 || index >= urls.length) {
      return res.status(404).json({ error: 'no such image' });
    }

    const upstream = await fetch(urls[index]);
    if (!upstream.ok || !upstream.body) {
      // The Replicate delivery URL may have expired, or the host is down.
      return res
        .status(502)
        .json({ error: 'could not fetch image', upstreamStatus: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const contentLength = upstream.headers.get('content-length');
    const ext = (IMAGE_EXT[contentType.split(';')[0].trim()] || 'jpg').replace(/[^a-z0-9]/gi, '');

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="picturesk-headshot-${index + 1}.${ext}"`
    );
    if (contentLength) res.setHeader('Content-Length', contentLength);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    // Pipe the upstream web stream through to the client. Readable.fromWeb keeps
    // memory flat (no full buffering) and forwards backpressure.
    const nodeStream = Readable.fromWeb(upstream.body);
    nodeStream.on('error', (err) => {
      captureError(err, { route: 'download', orderId: req.params.id });
      if (!res.headersSent) res.status(502).json({ error: 'could not read image' });
      else res.destroy(err);
    });
    nodeStream.pipe(res);
  } catch (err) {
    captureError(err, { route: 'download', orderId: req.params.id });
    if (!res.headersSent) return res.status(400).json({ error: err.message });
    return res.destroy(err);
  }
});

/**
 * GET /admin/orders  --  token-guarded operational view. Surfaces every order's
 * transition timestamps, flags any non-terminal order stuck too long, and shows
 * per-delivered-order margin. Optional ?status=TRAINING filter.
 *
 * Auth: Authorization: Bearer <ADMIN_TOKEN>  (or x-admin-token header).
 */
app.get('/admin/orders', async (req, res) => {
  if (!ADMIN_TOKEN) {
    return res.status(503).json({ error: 'admin disabled: set ADMIN_TOKEN' });
  }
  if (!adminAuthorized(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const { status } = req.query;
    if (status && !Object.values(ORDER_STATES).includes(status)) {
      return res.status(400).json({ error: `unknown status ${status}` });
    }
    const filter = status ? { status } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200);
    const items = orders.map(toAdminOrder);

    return res.json({
      count: items.length,
      stuckCount: items.filter((o) => o.stuck).length,
      stuckAfterMinutes: STUCK_AFTER_MS / 60000,
      orders: items,
    });
  } catch (err) {
    console.error('[api] GET /admin/orders failed:', err);
    captureError(err, { route: 'admin/orders' });
    return res.status(500).json({ error: err.message });
  }
});

// Sentry's Express error handler catches anything the route try/catch blocks miss
// (e.g. a throw in middleware). Registered after all routes, before listen. No-op
// when Sentry is disabled, so it is guarded on the DSN being set.
if (sentryEnabled) {
  Sentry.setupExpressErrorHandler(app);
}

app.listen(PORT, () => {
  console.log(`[api] listening on :${PORT}`);
});
