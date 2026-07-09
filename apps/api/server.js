// MUST be the first import: it initialises Sentry before express is loaded (so the
// SDK can instrument it) and loads the root .env before the dotenv.config() below.
import { Sentry, sentryEnabled, captureError } from './instrument.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomUUID, timingSafeEqual } from 'node:crypto';
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
  Order,
  ORDER_STATES,
  OrderTransitionConflictError,
  QUEUE_NAMES,
  transitionOrder,
} from '@headliner/shared';
import { detectFaces } from './faceDetector.js';
import { QUALITY, evaluateImages, countError } from './uploadGate.js';
import { RATE_LIMITS, createRateLimiters } from './rateLimit.js';

/**
 * Headliner API (Phase 4: uploads + delivery).
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

// How many gate detections may hit Replicate at once. Small on purpose: the
// vision provider rate-limits bursts (env-overridable if you raise your limits).
const DETECT_CONCURRENCY = Number.parseInt(process.env.UPLOAD_DETECT_CONCURRENCY, 10) || 4;

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
  return {
    orderId: order._id.toString(),
    status: order.status,
    customerEmail: order.customerEmail,
    resultImageUrls: order.resultImageUrls ?? [],
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
    try {
      await transitionOrder(orderId, ORDER_STATES.AWAITING_PAYMENT, ORDER_STATES.PAID, {
        amountPaidCents: session.amount_total,
        stripePaymentIntentId: session.payment_intent,
      });
    } catch (err) {
      // d. Already paid (a Stripe retry) or not in AWAITING_PAYMENT: do not
      //    enqueue again, but still acknowledge so Stripe stops retrying.
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
        const safeName = String(f.filename || 'photo').replace(/[^a-zA-Z0-9._-]/g, '_');
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
 * POST /checkout  --  create an order and a real Stripe Checkout Session.
 *
 * The server owns the price. The client cannot influence what is charged.
 *
 * Body: { customerEmail, uploadedImageUrls: string[] }  (real R2 URLs from the
 * direct upload above)
 *
 * Strict per-IP limit on top of the global one: this creates Stripe sessions and
 * Replicate detections, so it costs real money and is the tightest gate.
 */
app.post('/checkout', checkoutLimiter, async (req, res) => {
  try {
    const { customerEmail, uploadedImageUrls } = req.body ?? {};
    if (!customerEmail) {
      return res.status(400).json({ error: 'customerEmail is required' });
    }
    if (!Array.isArray(uploadedImageUrls) || uploadedImageUrls.length === 0) {
      return res.status(400).json({ error: 'uploadedImageUrls must be a non-empty array' });
    }

    // THIS IS THE REAL GATE. The web client runs the same face checks for fast
    // feedback, but that is UX only and can be bypassed by calling /checkout
    // directly, so we re-validate every image here and REFUSE to create the
    // Stripe session on failure. No session = no payment for input that would
    // train a bad model and then "succeed" into a DELIVERED order that never
    // triggers the FAILED auto-refund. Same lesson as server-owned pricing:
    // never trust the client's "it passed" claim.
    if (UPLOAD_QUALITY_GATE) {
      const nErr = countError(uploadedImageUrls.length);
      if (nErr) {
        return res.status(422).json({ error: 'quality_gate', countError: nErr, failures: [], rules: QUALITY });
      }
      // Detect with BOUNDED concurrency. Firing all N images at Replicate at once
      // reliably trips its rate limit, and a rate-limited image would fail closed
      // as "unreadable" and wrongly block a valid order. A small pool (plus the
      // detector's own 429 retry) keeps us under the limit.
      const detected = await mapWithLimit(uploadedImageUrls, DETECT_CONCURRENCY, async (url, index) => {
        try {
          return { index, url, ...(await detectFaces(url)) };
        } catch (err) {
          // Fail closed on a per-image detection error: an image we cannot read
          // is not allowed to buy its way through.
          console.error(`[api] face detection failed for ${url}: ${err.message}`);
          return { index, url, faceCount: 0, maxFaceBoxRatio: 0, error: true };
        }
      });
      const failures = evaluateImages(detected);
      if (failures.length) {
        return res.status(422).json({ error: 'quality_gate', failures, rules: QUALITY });
      }
    }

    // Create the order first so we have an id to put in the session metadata.
    // amountPaidCents is intentionally NOT set yet: it is written from Stripe in
    // the webhook once payment is confirmed.
    const order = await Order.create({
      customerEmail,
      uploadedImageUrls,
    });
    const orderId = order._id.toString();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: PRICE_CENTS,
            product_data: { name: 'Headliner professional headshots' },
          },
        },
      ],
      metadata: { orderId },
      success_url: `${WEB_BASE_URL}/success?orderId=${orderId}`,
      cancel_url: `${WEB_BASE_URL}/cancel?orderId=${orderId}`,
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
