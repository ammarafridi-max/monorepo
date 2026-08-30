// MUST be the first import: it initialises Sentry before express is loaded, so the
// SDK can instrument it.
import { Sentry, sentryEnabled, captureError } from './instrument.js';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { Readable } from 'node:stream';
import { ZipArchive } from 'archiver';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import Stripe from 'stripe';
import { Queue } from 'bullmq';
import {
  connectMongo,
  createEmailClient,
  createRedisConnection,
  createStorage,
  isValidLook,
  isValidAttire,
  isValidAgeRange,
  isValidGender,
  isValidRace,
  isValidFacialHair,
  getTier,
  isValidTier,
  DEFAULT_TIER,
  Order,
  ORDER_STATES,
  OrderTransitionConflictError,
  QUEUE_NAMES,
  transitionOrder,
} from '@travel-suite/picturesk-shared';
import { detectFaces } from './faceDetector.js';
import { assessPhoto } from './photoGate.js';
import { moderateImage, MODERATION_REASON } from './contentModerator.js';
import { QUALITY, evaluateImages, countError } from './uploadGate.js';
import { RATE_LIMITS, createRateLimiters } from './rateLimit.js';
import { createBlogRouter, createBlogTagRouter } from '@travel-suite/blog';
import { createAffiliatesRouter } from '@travel-suite/affiliates';
import { createAdminSubsystem } from './admin/index.js';
import { createBlogImageStorage } from './blogImageStorage.js';
import { createAdminDataRouter } from './admin/adminData.js';
import { createAdminActionsRouter } from './admin/adminActions.js';

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

// The server owns the price. The client picks a TIER id (validated against the
// shared pricing catalog); the server looks up the amount. Never trust the client
// for money: the only pricing input we accept is the tier id, never an amount.
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

const {
  MONGODB_URI,
  REDIS_URL,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  ADMIN_TOKEN,
  ADMIN_JWT_SECRET,
  ADMIN_JWT_EXPIRES_IN = '7d',
  ADMIN_COOKIE_EXPIRES_DAYS = '7',
  NODE_ENV = 'development',
  ANTHROPIC_API_KEY,
  BREVO_API_KEY,
  BREVO_SENDER = 'Picturesk.ai <hello@picturesk.ai>',
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

// The STRICT screen (sunglasses / hats / blur / dark) via a vision model, on top of
// face detection. On by default; needs UPLOAD_QUALITY_GATE on too (it augments it).
// A clean training set is the biggest lever on likeness, so we enforce it here.
const UPLOAD_STRICT_GATE = UPLOAD_QUALITY_GATE && (process.env.UPLOAD_STRICT_GATE ?? 'on') !== 'off';

// How many images the gate processes at once. Small on purpose: the vision
// provider rate-limits bursts (env-overridable if you raise your limits). Note
// each image now makes up to TWO Replicate calls (face + moderation), run in
// parallel per image, so effective concurrency against Replicate is ~2x this.
// Lowered to 2: each photo now makes up to THREE Replicate calls (face + moderation
// + strict screen). On a rate-limited (low-credit) account, high concurrency trips
// 429s and the fail-closed face check then rejects good photos. Env-overridable.
const DETECT_CONCURRENCY = Number.parseInt(process.env.UPLOAD_DETECT_CONCURRENCY, 10) || 2;

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

const mongoose = await connectMongo(MONGODB_URI);
console.log('[api] connected to MongoDB');

const stripe = new Stripe(STRIPE_SECRET_KEY);

// Brevo transactional email client, for the admin "resend delivery email" action.
// null when BREVO_API_KEY is unset (same convention as the worker), which makes
// resend return 503 rather than crash. The worker still owns first-time delivery.
const emailClient = BREVO_API_KEY
  ? createEmailClient({ apiKey: BREVO_API_KEY, sender: BREVO_SENDER })
  : null;

// A storage client for the admin "delete order" action (removes the uploaded
// selfies + training zip from R2). null when R2 is not configured, in which case
// delete still removes the order but skips storage cleanup.
const adminStorage = (() => {
  try {
    return createStorage();
  } catch (err) {
    console.warn(`[api] storage not configured; admin delete will skip R2 cleanup: ${err.message}`);
    return null;
  }
})();

const connection = createRedisConnection(REDIS_URL);
const orderPipeline = new Queue(QUEUE_NAMES.ORDER_PIPELINE, { connection });

// Enqueue options shared by every producer of the pipeline. jobId = orderId
// makes the enqueue idempotent: the same order can never be queued twice.
// `priority` comes from the purchased tier (lower number = higher priority in
// BullMQ), so a Premium order is pulled off the queue ahead of a Starter one.
function pipelineJobOpts(orderId, priority) {
  return {
    jobId: orderId,
    priority,
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
    // Processing clock anchors: paidAt is when the worker's work begins, deliveredAt
    // when it finishes, so the success page can show elapsed/total processing time.
    paidAt: order.paidAt ?? null,
    deliveredAt: order.deliveredAt ?? null,
    // A calm, non-technical hint for a failed order, so the success page can say
    // whether the payment has been refunded.
    failed: order.status === ORDER_STATES.FAILED,
    refunded: Boolean(order.refundedAt),
  };
}

/**
 * THE REAL upload gate: count + face quality + content moderation on the uploaded
 * images. Returns a { status, body } to send back on failure, or null if
 * everything passes. Runs inside POST /checkout, BEFORE the Stripe session is
 * created, so no failing input can be paid for. Structured 422 shapes let the
 * client show per-photo reasons and let the user swap photos.
 */
// Per-image detection cache (face + moderation + strict), keyed by URL in Redis.
// The upload step gates the photos first (POST /uploads/gate); by the time
// /checkout re-runs the gate, every URL is a cache hit, so checkout returns
// instantly instead of re-hitting Replicate. This is why the pay button no longer
// stalls. Only CLEAN results are cached -- an errored detection is recomputed.
const GATE_CACHE_TTL_S = Number.parseInt(process.env.UPLOAD_GATE_CACHE_TTL, 10) || 3600;

async function detectImageAll(url) {
  const [face, moderation, strict] = await Promise.all([
    UPLOAD_QUALITY_GATE
      ? detectFaces(url).catch((err) => {
          console.error(`[api] face detection failed for ${url}: ${err.message}`);
          captureError(err, { route: 'orders/images', phase: 'face-detection' });
          return { faceCount: 0, maxFaceBoxRatio: 0, error: true };
        })
      : Promise.resolve(null),
    UPLOAD_MODERATION
      ? moderateImage(url).catch((err) => {
          console.error(`[api] moderation failed for ${url}: ${err.message}`);
          captureError(err, { route: 'orders/images', phase: 'moderation' });
          return { safe: MODERATION_FAIL_OPEN, score: null, reason: MODERATION_REASON, errored: true };
        })
      : Promise.resolve({ safe: true }),
    // Strict screen fails OPEN (no issue) so a flaky VLM call never blocks a good
    // photo. `errored` marks that so we do not cache a fail-open as a real "clean".
    UPLOAD_STRICT_GATE
      ? assessPhoto(url).catch((err) => {
          console.error(`[api] photo screen failed for ${url}: ${err.message}`);
          captureError(err, { route: 'orders/images', phase: 'photo-screen' });
          return { issue: null, errored: true };
        })
      : Promise.resolve({ issue: null }),
  ]);
  return { face, moderation, strict };
}

async function cachedDetect(url) {
  // v2: bumped when the gate rules eased (subject-size aware multi-person check +
  // lower min subject size), so photos cached as failures re-evaluate under the new rules.
  const key = `gate:v2:${url}`;
  try {
    const hit = await connection.get(key);
    if (hit) return JSON.parse(hit);
  } catch {
    /* cache read failure -> just compute */
  }
  const res = await detectImageAll(url);
  const clean = !res.face?.error && !res.moderation?.errored && !res.strict?.errored;
  if (clean) {
    try {
      await connection.set(key, JSON.stringify(res), 'EX', GATE_CACHE_TTL_S);
    } catch {
      /* cache write failure is non-fatal */
    }
  }
  return res;
}

async function runUploadGate(uploadedImageUrls) {
  if (!(UPLOAD_QUALITY_GATE || UPLOAD_MODERATION)) return null;

  const nErr = countError(uploadedImageUrls.length);
  if (nErr) {
    return { status: 422, body: { error: 'quality_gate', countError: nErr, failures: [], rules: QUALITY } };
  }

  // Bounded concurrency (firing all N at Replicate at once trips its rate limit).
  // Each image's detections are memoized per URL in Redis (cachedDetect), so a URL
  // already screened at the upload step is a cache hit here.
  const results = await mapWithLimit(uploadedImageUrls, DETECT_CONCURRENCY, async (url, index) => {
    const { face, moderation, strict } = await cachedDetect(url);
    return { index, url, face, moderation, strict };
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
    const failures = evaluateImages(
      results.map((r) => ({ index: r.index, url: r.url, ...r.face, qualityIssue: r.strict?.issue }))
    );
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
// the JSON endpoints. credentials:true lets the browser send the admin session
// cookie (`jwt`) on cross-origin /auth and /admin calls; the origin is
// still pinned to WEB_BASE_URL so this is not an open CORS surface. The webhook is
// server-to-server and needs no CORS.
app.use(cors({ origin: WEB_BASE_URL, credentials: true }));

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

    // c. Transition succeeded -> hand the order to the pipeline exactly once,
    //    at the priority its purchased tier bought (higher tiers jump the queue).
    const { priority } = getTier(order.tier);
    await orderPipeline.add('process-order', { orderId }, pipelineJobOpts(orderId, priority));
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

// Parse cookies so the admin auth middleware can read the httpOnly session cookie
// (`jwt`). Mounted after the raw webhook body parser, before any route
// that needs req.cookies.
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Global per-IP backstop on every route BELOW this line. Mounted after the
// webhook (which is registered earlier and must never be throttled) and after
// /health (so Fly.io health checks are never limited).
app.use(globalLimiter);

/**
 * Admin auth (staff accounts), from the shared @travel-suite/auth domain: POST
 * /auth/login with email+password issues an httpOnly JWT cookie (`jwt`); GET
 * /auth/me returns the current admin. The subsystem also hands back the combined
 * guard used by the /admin data and action routes.
 *
 * Disabled gracefully when ADMIN_JWT_SECRET is unset (503), exactly like the
 * ADMIN_TOKEN break-glass route, so a deploy without the secret still boots.
 */
const admin = createAdminSubsystem({
  db: mongoose.connection,
  jwtSecret: ADMIN_JWT_SECRET,
  jwtExpiresIn: ADMIN_JWT_EXPIRES_IN,
  cookieExpiresInDays: Number(ADMIN_COOKIE_EXPIRES_DAYS) || 7,
  nodeEnv: NODE_ENV,
  adminToken: ADMIN_TOKEN,
  isTokenAuthorized: adminAuthorized,
});
const { guard: adminGuard, restrictTo } = admin;

// Mounted twice on purpose. The shared frontend admin services call /api/*, while
// the ADMIN_TOKEN scripts, monitoring, and the Postman collection still use the
// unprefixed paths. Both point at the same router instances. Drop the unprefixed
// mounts once nothing outside the browser uses them.
app.use('/auth', admin.authRouter);
app.use('/api/auth', admin.authRouter);
if (admin.authEnabled) {
  console.log('[api] admin auth ON (cookie sessions)');
} else {
  console.warn('[api] ADMIN_JWT_SECRET unset: admin auth disabled (/auth returns 503)');
}

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
 * POST /uploads/gate  --  run the upload quality gate on the given image URLs
 * WITHOUT creating an order or a Stripe session. The upload step calls this so the
 * (slow) evaluation happens THERE, with a "Checking your photos" state, instead of
 * on the pay button. Results are cached per URL, so the later /checkout gate is a
 * cache hit and returns instantly. Same 422 shape as /checkout on failure.
 *
 * Body: { uploadedImageUrls: [] }
 */
app.post('/uploads/gate', presignLimiter, async (req, res) => {
  try {
    const { uploadedImageUrls } = req.body ?? {};
    if (!Array.isArray(uploadedImageUrls) || uploadedImageUrls.length === 0) {
      return res.status(400).json({ error: 'uploadedImageUrls must be a non-empty array' });
    }
    const gate = await runUploadGate(uploadedImageUrls);
    if (gate) return res.status(gate.status).json(gate.body);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[api] POST /uploads/gate failed:', err);
    captureError(err, { route: 'uploads/gate' });
    return res.status(500).json({ error: 'gate failed' });
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
      tier,
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
    // Pricing tier. Optional for back-compat (absent -> default tier); a value that
    // is present must be a real tier. The server owns the price via getTier below,
    // so a tampered client can at worst pick a valid tier, never set an amount.
    if (tier != null && tier !== '' && !isValidTier(tier)) {
      return res.status(400).json({ error: 'tier is not a known pricing tier' });
    }
    const selectedTier = getTier(tier || DEFAULT_TIER);

    // NO image screening here. Photos are gated ONCE, at the upload step
    // (POST /uploads/gate, run by /ai-headshot-generator/upload) -- face quality, content
    // moderation, and the 5-to-15 count all happen there. Checkout only creates the
    // Stripe session, so the pay step returns the payment URL immediately with zero
    // Replicate calls and no stall. (uploadedImageUrls is already validated as a
    // non-empty array above.)

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
      // Stamp the tier + a snapshot of its numeric levers so the worker delivers
      // the right count even if the catalog later changes (durable record).
      tier: selectedTier.id,
      deliverCount: selectedTier.deliverCount,
      generateCount: selectedTier.generateCount,
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
            unit_amount: selectedTier.priceCents,
            product_data: {
              name: `Picturesk headshots (${selectedTier.label}, ${selectedTier.deliverCount} photos)`,
            },
          },
        },
      ],
      metadata: { orderId },
      success_url: `${WEB_BASE_URL}/success?orderId=${orderId}`,
      // Cancel returns to the payment step so they can retry (a new order).
      cancel_url: `${WEB_BASE_URL}/ai-headshot-generator/payment`,
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
 * GET /orders/:id/download-all  --  bundle every delivered headshot into ONE zip
 * and stream it as an attachment, so "Download all" saves a single
 * picturesk-headshots.zip instead of firing N separate downloads.
 *
 * Same order-scoping / no-SSRF story as the single-image route: the URLs come
 * from the order in our DB, never a request parameter. We fetch every image
 * FIRST (bounded concurrency) so a failed or expired upstream yields a clean 502
 * BEFORE any zip bytes are sent, never a truncated archive. JPEGs are already
 * compressed, so the zip uses STORE (level 0): near-instant and no wasted CPU.
 */
app.get('/orders/:id/download-all', async (req, res) => {
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
    if (urls.length === 0) return res.status(404).json({ error: 'no images to download' });

    // Fetch all images up front. Buffering lets us fail cleanly (502) before a
    // single byte of the zip is written, so the customer never gets a half-written
    // archive. The first failure wins; order is preserved by mapWithLimit.
    let failure = null;
    const files = await mapWithLimit(urls, 6, async (url, i) => {
      const upstream = await fetch(url);
      if (!upstream.ok) {
        failure = failure ?? { index: i, status: upstream.status };
        return null;
      }
      const contentType = (upstream.headers.get('content-type') || 'image/jpeg')
        .split(';')[0]
        .trim();
      const ext = (IMAGE_EXT[contentType] || 'jpg').replace(/[^a-z0-9]/gi, '');
      const buf = Buffer.from(await upstream.arrayBuffer());
      return { name: `picturesk-headshot-${i + 1}.${ext}`, buf };
    });
    if (failure) {
      return res
        .status(502)
        .json({ error: 'could not fetch image', imageIndex: failure.index, upstreamStatus: failure.status });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="picturesk-headshots.zip"');
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const zip = new ZipArchive({ zlib: { level: 0 } }); // STORE: JPEGs don't compress
    zip.on('error', (err) => {
      captureError(err, { route: 'download-all', orderId: req.params.id });
      if (!res.headersSent) res.status(500).json({ error: 'could not build zip' });
      else res.destroy(err);
    });
    zip.pipe(res);
    for (const f of files) zip.append(f.buf, { name: f.name });
    await zip.finalize();
  } catch (err) {
    captureError(err, { route: 'download-all', orderId: req.params.id });
    if (!res.headersSent) return res.status(400).json({ error: err.message });
    return res.destroy(err);
  }
});

/**
 * The read-only admin data surface: GET /admin/orders (list), /admin/orders/:id
 * (detail), /admin/stats, /admin/customers. Projections + handlers live in
 * ./admin/adminData.js so no customer-facing route can leak margin/Stripe/Replicate.
 */
/**
 * Admin ORDER ACTIONS (refund / retry / resend email). Mounted at /admin BEFORE
 * the read-only data router: its per-route guards match only the POST action paths,
 * so read requests fall through to the data router untouched. Admin-only.
 */
const adminActionsRouter = createAdminActionsRouter({
  guard: adminGuard,
  restrictTo,
  stripe,
  orderPipeline,
  pipelineJobOpts,
  emailClient,
  storage: adminStorage,
  webBaseUrl: WEB_BASE_URL,
});
const adminDataRouter = createAdminDataRouter({ guard: adminGuard, restrictTo });

app.use('/admin', adminActionsRouter);
app.use('/admin', adminDataRouter);
app.use('/api/admin', adminActionsRouter);
app.use('/api/admin', adminDataRouter);

/**
 * Admin-user MANAGEMENT (create/edit/deactivate/delete staff, reset passwords).
 * Admin-only (restrictTo('admin') inside the router), so support-role staff cannot
 * reach it. Same combined guard as the data routes.
 */
app.use('/admin-users', admin.adminUsersRouter);
app.use('/api/admin-users', admin.adminUsersRouter);

/**
 * Content and partners, from the shared travel-suite domains. `guard` is passed
 * as `protect` so the ADMIN_TOKEN break-glass path reaches these too.
 *
 * Blog cover images go to R2 (see blogImageStorage.js) rather than the Cloudinary
 * client the travel brands inject. With no R2 configured the blog still serves
 * and edits; only image upload returns a 500 from the domain's own guard.
 *
 * The blog's own GET / and GET /slug/:slug are mounted above its protect call,
 * so a public site can read published posts without a session.
 */
const sharedAuth = { protect: adminGuard, restrictTo };

const blogRouter = createBlogRouter({
  db: mongoose.connection,
  auth: sharedAuth,
  imageStorage: createBlogImageStorage({ storage: adminStorage }),
  anthropicApiKey: ANTHROPIC_API_KEY,
});
const blogTagRouter = createBlogTagRouter({ db: mongoose.connection, auth: sharedAuth });

// Picturesk sells one thing and has no tickets or insurance policies, so no
// commissionable model is injected. Affiliate CRUD works; the per-affiliate
// ticket/application tables the travel dashboards show stay empty here.
const affiliatesRouter = createAffiliatesRouter({ db: mongoose.connection, auth: sharedAuth });

app.use('/blogs', blogRouter);
app.use('/blog-tags', blogTagRouter);
app.use('/affiliates', affiliatesRouter);
app.use('/api/blogs', blogRouter);
app.use('/api/blog-tags', blogTagRouter);
app.use('/api/affiliates', affiliatesRouter);

// Sentry's Express error handler catches anything the route try/catch blocks miss
// (e.g. a throw in middleware). Registered after all routes, before listen. No-op
// when Sentry is disabled, so it is guarded on the DSN being set.
if (sentryEnabled) {
  Sentry.setupExpressErrorHandler(app);
}

/**
 * App-level error handler, matching the travel-suite backends. The /auth, /admin
 * and /admin-users routers hand operational AppErrors to next(); anything else is
 * a bug and renders as a generic 500 so internals never leak to a client.
 */
app.use((err, req, res, _next) => {
  // A Mongoose ValidationError is the caller sending bad data, not a bug. Without
  // this it renders as a generic 500 and the admin UI shows "Something went wrong"
  // instead of which field is wrong.
  if (err?.name === 'ValidationError' && err.errors) {
    const message = Object.values(err.errors).map((e) => e.message).join('. ');
    return res.status(400).json({ status: 'fail', message });
  }
  if (err?.name === 'CastError') {
    return res.status(400).json({ status: 'fail', message: `Invalid ${err.path}` });
  }

  const statusCode = err.isOperational ? err.statusCode : 500;
  const status = err.status || (`${statusCode}`.startsWith('4') ? 'fail' : 'error');
  if (!err.isOperational) {
    console.error('[api] unhandled route error:', err);
    captureError(err, { route: req.originalUrl });
  }
  res.status(statusCode).json({
    status,
    message: err.isOperational ? err.message : 'Something went wrong',
  });
});

app.listen(PORT, () => {
  console.log(`[api] listening on :${PORT}`);
});
